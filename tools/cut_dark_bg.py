#!/usr/bin/env python3
"""Удаляет тёмный студийный фон (виньетку) у спрайтов-персонажей.

Фон — гладкий тёмный десатурированный градиент вокруг фигуры. Алгоритм:
разрастание области фона от краёв изображения по непрерывности цвета
(сравнение с уже-фоновым соседом), с защитой насыщенных (цветных) пикселей
фигуры. По краю — лёгкое сглаживание альфы.

Использование: python tools/cut_dark_bg.py вход.png выход.png [T] [satMax]
"""
import sys
from collections import deque
from PIL import Image


def cut(inp, outp, T=34, sat_max=58, bright_max=150):
    im = Image.open(inp).convert('RGBA')
    W, H = im.size
    px = list(im.getdata())
    N = W * H
    R = [p[0] for p in px]; G = [p[1] for p in px]; B = [p[2] for p in px]
    bg = bytearray(N)        # 1 = фон
    visited = bytearray(N)
    dq = deque()

    def sat(i):
        hi = max(R[i], G[i], B[i]); lo = min(R[i], G[i], B[i])
        return hi - lo

    def bglike(i):
        # фон: тёмный и малонасыщенный
        return sat(i) <= sat_max and (R[i]+G[i]+B[i])//3 <= bright_max

    def seed(i):
        if not visited[i] and bglike(i):
            visited[i] = 1; bg[i] = 1; dq.append(i)

    for x in range(W):
        seed(x); seed((H-1)*W + x)
    for y in range(H):
        seed(y*W); seed(y*W + W-1)

    while dq:
        i = dq.popleft()
        x = i % W
        nb = []
        if x > 0: nb.append(i-1)
        if x < W-1: nb.append(i+1)
        if i >= W: nb.append(i-W)
        if i < N-W: nb.append(i+W)
        for j in nb:
            if visited[j]:
                continue
            # цветную (насыщенную) часть фигуры не трогаем
            if sat(j) > sat_max:
                visited[j] = 1; continue
            d = abs(R[j]-R[i]) + abs(G[j]-G[i]) + abs(B[j]-B[i])
            if d <= T:
                visited[j] = 1; bg[j] = 1; dq.append(j)

    alpha = bytearray(255 if not bg[i] else 0 for i in range(N))

    # Сглаживание края: полупрозрачность для тёмных пикселей фигуры у границы фона
    def has_bg_neighbor(i, x, y):
        if x > 0 and bg[i-1]: return True
        if x < W-1 and bg[i+1]: return True
        if y > 0 and bg[i-W]: return True
        if y < H-1 and bg[i+W]: return True
        return False
    for y in range(H):
        base = y*W
        for x in range(W):
            i = base + x
            if bg[i]:
                continue
            if sat(i) <= sat_max and (R[i]+G[i]+B[i])//3 <= bright_max+20 and has_bg_neighbor(i, x, y):
                alpha[i] = 130

    out = [(R[i], G[i], B[i], alpha[i]) for i in range(N)]
    im.putdata(out)
    im.save(outp)
    cleared = sum(1 for v in alpha if v == 0)
    print('%s -> %s  cleared %d%%' % (inp.split('/')[-1], outp.split('/')[-1], 100*cleared//N))


if __name__ == '__main__':
    T = int(sys.argv[3]) if len(sys.argv) > 3 else 34
    sat_max = int(sys.argv[4]) if len(sys.argv) > 4 else 58
    cut(sys.argv[1], sys.argv[2], T, sat_max)
