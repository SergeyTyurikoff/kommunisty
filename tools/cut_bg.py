#!/usr/bin/env python3
"""Cut near-white background from a sprite via border-connected flood fill.

Keeps interior white pixels (smoke, highlights) that are not connected to the
image border. Adds an alpha channel and softens the 1px white fringe.
"""
import sys
from collections import deque
from PIL import Image


def is_bg(r, g, b, mn=205, sat=28):
    lo = r if r < g else g
    if b < lo:
        lo = b
    hi = r if r > g else g
    if b > hi:
        hi = b
    return lo >= mn and (hi - lo) <= sat


def cut(inp, outp):
    im = Image.open(inp).convert('RGBA')
    W, H = im.size
    px = list(im.getdata())  # list of (r,g,b,a)
    alpha = bytearray(255 for _ in range(W * H))
    visited = bytearray(W * H)

    dq = deque()
    # seed every border pixel that looks like background
    def seed(i):
        if not visited[i]:
            r, g, b, a = px[i]
            if is_bg(r, g, b):
                visited[i] = 1
                alpha[i] = 0
                dq.append(i)
    for x in range(W):
        seed(x)                    # top row
        seed((H - 1) * W + x)      # bottom row
    for y in range(H):
        seed(y * W)                # left col
        seed(y * W + W - 1)        # right col

    while dq:
        i = dq.popleft()
        x = i % W
        # 4-connected neighbours
        if x > 0:
            j = i - 1
            if not visited[j]:
                r, g, b, a = px[j]
                if is_bg(r, g, b):
                    visited[j] = 1; alpha[j] = 0; dq.append(j)
        if x < W - 1:
            j = i + 1
            if not visited[j]:
                r, g, b, a = px[j]
                if is_bg(r, g, b):
                    visited[j] = 1; alpha[j] = 0; dq.append(j)
        if i >= W:
            j = i - W
            if not visited[j]:
                r, g, b, a = px[j]
                if is_bg(r, g, b):
                    visited[j] = 1; alpha[j] = 0; dq.append(j)
        if i < W * (H - 1):
            j = i + W
            if not visited[j]:
                r, g, b, a = px[j]
                if is_bg(r, g, b):
                    visited[j] = 1; alpha[j] = 0; dq.append(j)

    # Defringe: opaque light pixels touching a transparent pixel -> fade alpha
    # by how white they are, to kill the bright halo left by anti-aliasing.
    def transparent_neighbour(i, x, y):
        if x > 0 and alpha[i - 1] == 0: return True
        if x < W - 1 and alpha[i + 1] == 0: return True
        if y > 0 and alpha[i - W] == 0: return True
        if y < H - 1 and alpha[i + W] == 0: return True
        return False

    for y in range(H):
        base = y * W
        for x in range(W):
            i = base + x
            if alpha[i] == 0:
                continue
            r, g, b, a = px[i]
            lo = min(r, g, b)
            if lo >= 170 and transparent_neighbour(i, x, y):
                # 170 -> keep, 255 -> almost gone
                fade = int(255 * (255 - lo) / 85)
                if fade < alpha[i]:
                    alpha[i] = fade

    out = [(px[i][0], px[i][1], px[i][2], alpha[i]) for i in range(W * H)]
    im.putdata(out)
    im.save(outp)
    cleared = sum(1 for v in alpha if v == 0)
    print(f'{inp} -> {outp}  cleared {cleared}/{W*H} ({100*cleared//(W*H)}%)')


if __name__ == '__main__':
    cut(sys.argv[1], sys.argv[2])
