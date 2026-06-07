'use strict';
window.KP = window.KP || {};
KP.AudioSystem = class AudioSystem {
  constructor(){
    this.supported = typeof Audio === 'function';
    this.unlocked = !this.supported;
    this.musicStarted = false;
    this.music = null;
    this.soundPools = {};
    this.masterVolume = 1;
    if(!this.supported) return;

    // Треш-метал саундтрек (Suno). Два трека крутятся плейлистом по кругу.
    this.musicTracks = ['audio/music_mold_red_riot.mp3', 'audio/music_mold_red_riot_2.mp3'];
    this.musicIndex = Math.floor(Math.random() * this.musicTracks.length);
    this.music = this.makeAudio(this.musicTracks[this.musicIndex], {loop:false, volume:.32});
    if(this.music.addEventListener) this.music.addEventListener('ended', () => this._nextTrack());
    this.soundPools = {
      menuStart:this.makePool('audio/menu_start.wav', 2, .75),
      pistol:this.makePool('audio/shot_pistol.wav', 4, .62),
      rifle:this.makePool('audio/shot_rifle.wav', 4, .68),
      smg:this.makePool('audio/shot_smg.wav', 5, .48),
      shotgun:this.makePool('audio/shot_shotgun.wav', 3, .72),
      flame:this.makePool('audio/shot_flame.wav', 3, .5),
      sabre:this.makePool('audio/swing_sabre.wav', 3, .58),
      enemyHit:this.makePool('audio/enemy_hit.wav', 4, .45),
      enemyDown:this.makePool('audio/enemy_down.wav', 3, .6),
      pickupMoney:this.makePool('audio/pickup_money.wav', 3, .55),
      pickupAmmo:this.makePool('audio/pickup_ammo.wav', 3, .5),
      pickupTime:this.makePool('audio/pickup_time.wav', 3, .55),
      playerHit:this.makePool('audio/player_hit.wav', 3, .55),
      playerDown:this.makePool('audio/player_down.wav', 2, .62),
      timeStop:this.makePool('audio/time_stop.wav', 2, .62),
      portal:this.makePool('audio/portal.wav', 2, .52)
    };
    this.bindUnlock();
  }

  makeAudio(src, opts={}){
    const a=new Audio(src);
    a.preload='auto';
    a.loop=!!opts.loop;
    a.volume=opts.volume !== undefined ? opts.volume : 1;
    return a;
  }

  makePool(src, count, volume){
    return {
      volume,
      index:0,
      nodes:Array.from({length:count},()=>this.makeAudio(src,{volume}))
    };
  }

  bindUnlock(){
    if(typeof window === 'undefined' || !window.addEventListener) return;
    const unlock=()=>{
      if(this.unlocked) return;
      this.unlocked=true;
      if(this.music){
        const prevMuted=this.music.muted;
        this.music.muted=true;
        const attempt=this.music.play();
        Promise.resolve(attempt).then(()=>{
          this.music.pause();
          this.music.currentTime=0;
          this.music.muted=prevMuted;
        }).catch(()=>{
          this.music.muted=prevMuted;
        });
      }
      if(window.removeEventListener){
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchstart', unlock);
      }
    };
    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  _nextTrack(){
    if(!this.music || !this.musicTracks || !this.musicTracks.length) return;
    this.musicIndex = (this.musicIndex + 1) % this.musicTracks.length;
    this.music.src = this.musicTracks[this.musicIndex];
    this.music.currentTime = 0;
    const attempt = this.music.play();
    Promise.resolve(attempt).catch(()=>{});
  }

  playMusic(reset=false){
    if(!this.supported || !this.unlocked || !this.music) return;
    if(reset){
      // Со свежего старта берём случайный трек из плейлиста.
      this.musicIndex = Math.floor(Math.random() * this.musicTracks.length);
      this.music.src = this.musicTracks[this.musicIndex];
      this.music.currentTime = 0;
    }
    if(this.musicStarted) return;
    this.musicStarted=true;
    const attempt=this.music.play();
    Promise.resolve(attempt).catch(()=>{ this.musicStarted=false; });
  }

  stopMusic(reset=false){
    if(!this.music) return;
    this.music.pause();
    if(reset) this.music.currentTime=0;
    this.musicStarted=false;
  }

  play(id, rate=1, volumeMul=1){
    if(!this.supported || !this.unlocked) return;
    const pool=this.soundPools[id];
    if(!pool || !pool.nodes.length) return;
    const node=pool.nodes[pool.index];
    pool.index=(pool.index+1)%pool.nodes.length;
    node.pause();
    node.currentTime=0;
    node.playbackRate=rate;
    node.volume=Math.max(0,Math.min(1,pool.volume*volumeMul*this.masterVolume));
    const attempt=node.play();
    Promise.resolve(attempt).catch(()=>{});
  }

  playWeapon(weapon){
    const map={
      pistol:'pistol',
      mosin:'rifle',
      smg:'smg',
      flamethrower:'flame',
      gasSprayer:'flame',
      sabre:'sabre',
      shotgun:'shotgun'
    };
    const id=map[weapon];
    if(!id) return;
    const rate=weapon==='smg'?0.97+Math.random()*0.08:weapon==='sabre'?0.94+Math.random()*0.12:0.98+Math.random()*0.05;
    this.play(id,rate);
  }

  playPickup(type){
    if(type==='money') return this.play('pickupMoney',1+Math.random()*0.08);
    if(type==='ammo') return this.play('pickupAmmo',.96+Math.random()*0.12);
    if(type==='time'||type==='heal'||type==='medkit') return this.play('pickupTime',.92+Math.random()*0.06);
    if(type==='gasMask') return this.play('pickupAmmo',1.05,.7);
  }
};
