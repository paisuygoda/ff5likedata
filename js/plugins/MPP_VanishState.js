//=============================================================================
// MPP_VanishState.js
//=============================================================================
// Copyright (c) 2017 Mokusei Penguin
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc 【ver.1.0】戦闘中、バトラーを半透明化させる特徴が作成できます。
 * @author 木星ペンギン
 *
 * @help 特徴を持つオブジェクトのメモ欄:
 *   <MPP_Vanish>      # 半透明化
 * 
 * ================================
 * ●武器・ステートエフェクト等は半透明化されません。
 * 
 * ================================
 * 制作 : 木星ペンギン
 * URL : http://woodpenguin.blog.fc2.com/
 * 
 * 
 */

(function() {

var Alias = {};

//-----------------------------------------------------------------------------
// Bitmap

Bitmap.mppVanish = function(baseBitmap) {
    return new Bitmap()._startMppVanish(baseBitmap);
};

Bitmap.prototype._startMppVanish = function(bitmap) {
    this._loadingState === 'transVanish';
    this.resize(bitmap.width, bitmap.height);
    setTimeout(this._transMppVanish.bind(this, bitmap), 1);
    return this;
};

Bitmap.prototype._transMppVanish = function(bitmap) {
    var imageData = bitmap._context.getImageData(0, 0, bitmap.width, bitmap.height);
    var pixels = imageData.data;
    function rgbToAlpha(r, g, b) {
        return 255 - (Math.min(r, g, b) + Math.max(r, g, b)) / 2;
    }
    for (var i = 0; i < pixels.length; i += 4) {
        if (pixels[i+3] === 0) continue;

        var alpha = rgbToAlpha(pixels[i+0], pixels[i+1], pixels[i+2]);
        pixels[i+0] = 255;
        pixels[i+1] = 255;
        pixels[i+2] = 255;
        pixels[i+3] = Math.floor(pixels[i+3] * alpha / 255);
    }
    this._context.putImageData(imageData, 0, 0);
    this._setDirty();
    this._loadingState === 'loaded';
};


//-----------------------------------------------------------------------------
// Game_BattlerBase

Game_BattlerBase.prototype.isMppVanish = function() {
    return this.traitObjects().some(function(obj) {
        return !!obj.meta.MPP_Vanish;
    });
};

//-----------------------------------------------------------------------------
// Sprite_Battler

//19
Alias.SpBa_initMembers = Sprite_Battler.prototype.initMembers;
Sprite_Battler.prototype.initMembers = function() {
    Alias.SpBa_initMembers.call(this);
    this._vanish = false;
    this._vanishDuration = 0;
    this._vanishBitmap = null;
};

Sprite_Battler.prototype.createVanishSprite = function() {
    this._vanishSprite = new Sprite();
    this._vanishSprite.anchor.x = 0.5;
    this._vanishSprite.anchor.y = 1;
    this.addChildAt(this._vanishSprite, this.vanishIndex());
};

Sprite_Battler.prototype.vanishIndex = function() {
    return 0;
};

//63
Alias.SpBa_updateMain = Sprite_Battler.prototype.updateMain;
Sprite_Battler.prototype.updateMain = function() {
    Alias.SpBa_updateMain.call(this);
    if (this._battler.isSpriteVisible()) {
        this.updateVanish();
    }
};

Sprite_Battler.prototype.updateVanish = function() {
    if (this._battler.isMppVanish()) {
        if (!this._effectTarget.bitmap || !this._effectTarget.bitmap.isReady())
            return;
        if (!this._vanishBitmap) {
            this._vanishBitmap = Bitmap.mppVanish(this._effectTarget.bitmap);
        }
        if (!this._vanish && this._vanishBitmap.isReady()) {
            this.startVanish();
        }
    } else if (this._vanish) {
        this._vanish = false;
        this._vanishDuration = 32;
    }
    if (this._vanishDuration > 0) {
        this._vanishDuration--;
        var d = this._vanishDuration;
        if (this._vanish) {
            this._vanishSprite.opacity = d * 8;
        } else {
            this._vanishSprite.opacity = 255 - d * 8;
            if (d === 0) {
                var frame = this.getTargetRect();
                this._effectTarget.bitmap = this._vanishSprite.bitmap;
                this._effectTarget.setFrame(frame.x, frame.y, frame.width, frame.height);
                this._vanishSprite.bitmap = null;
                this._vanishBitmap = null;
            }
        }
        if (d > 0) {
            var frame = this.getTargetRect();
            this._vanishSprite.setFrame(frame.x, frame.y, frame.width, frame.height);
            this._vanishSprite.visible = true;
        } else {
            this._vanishSprite.visible = false;
        }
    }
};

Sprite_Battler.prototype.startVanish = function() {
    this._vanish = true;
    this._vanishDuration = 32;
    var frame = this.getTargetRect();
    this._vanishSprite.bitmap = this._effectTarget.bitmap;
    this._vanishSprite.setFrame(frame.x, frame.y, frame.width, frame.height);
    this._effectTarget.bitmap = this._vanishBitmap;
    this._effectTarget.setFrame(frame.x, frame.y, frame.width, frame.height);
};

Sprite_Battler.prototype.getTargetRect = function() {
    var frame = this._effectTarget._frame;
    return new Rectangle(frame.x, frame.y, frame.width, frame.height);
};

//-----------------------------------------------------------------------------
// Sprite_Actor

//39
Alias.SpAcinitMembers = Sprite_Actor.prototype.initMembers;
Sprite_Actor.prototype.initMembers = function() {
    Alias.SpAcinitMembers.call(this);
    this.createVanishSprite();
};

Sprite_Actor.prototype.vanishIndex = function() {
    return this.children.indexOf(this._mainSprite) + 1;
};

//151
Alias.SpAc_updateBitmap = Sprite_Actor.prototype.updateBitmap;
Sprite_Actor.prototype.updateBitmap = function() {
    var bitmap = this._mainSprite.bitmap;
    Alias.SpAc_updateBitmap.call(this);
    if (bitmap !== this._mainSprite.bitmap) {
        this._vanish = false;
        this._vanishSprite.bitmap = null;
        this._vanishBitmap = null;
    }
};

//-----------------------------------------------------------------------------
// Sprite_Enemy

//17
Alias.SpEn_initMembers = Sprite_Enemy.prototype.initMembers;
Sprite_Enemy.prototype.initMembers = function() {
    Alias.SpEn_initMembers.call(this);
    this.createVanishSprite();
};

//61
Alias.SpEn_loadBitmap = Sprite_Enemy.prototype.loadBitmap;
Sprite_Enemy.prototype.loadBitmap = function(name, hue) {
    Alias.SpEn_loadBitmap.call(this, name, hue);
    this._vanish = false;
    this._vanishSprite.bitmap = null;
    this._vanishBitmap = null;
};



})();
