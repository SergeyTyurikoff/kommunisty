'use strict';
window.KP = window.KP || {};
KP.Input = class Input {
  constructor(){
    this.down = new Set();
    this.pressed = new Set();
    this.mouseDown = false;
    window.addEventListener('keydown', e => {
      const key = String(e.key || '').toLowerCase();
      this.down.add(e.code); this.down.add(key);
      this.pressed.add(e.code); this.pressed.add(key);
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => {
      const key = String(e.key || '').toLowerCase();
      this.down.delete(e.code); this.down.delete(key);
    });
    window.addEventListener('mousedown', () => { this.mouseDown = true; this.pressed.add('Mouse0'); });
    window.addEventListener('mouseup', () => { this.mouseDown = false; });
  }
  tick(){ this.pressed.clear(); }
  isDown(action){ return this.map(action).some(k => this.down.has(k)); }
  wasPressed(action){ return this.map(action).some(k => this.pressed.has(k)); }
  map(action){
    const m = {
      left:    ['KeyA','ArrowLeft','a','ф'],
      right:   ['KeyD','ArrowRight','d','в'],
      up:      ['KeyW','ArrowUp','w','ц'],
      downAct: ['KeyS','ArrowDown','s','ы'],
      interact:['KeyE','e','у'],
      weaponNext:['KeyQ','q','й'],
      inventory: ['KeyI','i','ш'],
      restart:   ['KeyR','r','к'],
      run:       ['ShiftLeft','ShiftRight','Shift'],
      turbo:     ['KeyC','c','с'],
      timeStop:  ['KeyF','f','а'],
      attack:    ['Mouse0','KeyJ','j','о'],
      dodge:     ['KeyZ','z','я'],
      one:  ['Digit1','Numpad1','1'],
      two:  ['Digit2','Numpad2','2'],
      three:['Digit3','Numpad3','3'],
      four: ['Digit4','Numpad4','4'],
      five: ['Digit5','Numpad5','5'],
      six:  ['Digit6','Numpad6','6'],
      esc:  ['Escape'],
      start:['Enter','Space','KeyR','r','к','Mouse0']
    };
    return m[action] || [];
  }
};
