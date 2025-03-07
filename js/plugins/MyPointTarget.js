/*:
 * @plugindesc 選択中のBattlerはハイライトせず指さす
 * @author paisuygoda
 */

(function() {

	Sprite_Battler.prototype.initialize = function(battler) {
    Sprite_Base.prototype.initialize.call(this);
    this.initMembers();
    this.setBattler(battler);
    this.createPointSlot();
	};

	Sprite_Battler.prototype.createPointSlot = function() {
	    this._pointSlot = new Sprite_Point();
	    this._pointSlot.bitmap = new Bitmap(32, 32);
		this._pointSlot.anchor.x = -0.4 * this.width / this._pointSlot.width;
		this._pointSlot.anchor.y = 0.5 * this.height / this._pointSlot.height;
	    this.addChild(this._pointSlot);
	};

	Sprite_Battler.prototype.update = function() {
		Sprite_Base.prototype.update.call(this);
		if (this._battler) {
			this.updateMain();
			this.updateAnimation();
			this.updateDamagePopup();
			this.updateSelectionEffect();
			// 初期化段階ではbattler情報を基にした位置情報が入ってないのでここで入れる
			if (this._battler) {
				if (this._battler.isActor()) {
					this._pointSlot.anchor.x = -1.0;
					this._pointSlot.anchor.y = 1.3;
				}
				else {
					this._pointSlot.anchor.x = this._battler.cursorX * this.width / this._pointSlot.width;
					this._pointSlot.anchor.y = this._battler.cursorY * this.height / this._pointSlot.height;
				}
			}
			// アクターが小人の時ポインタまで小さくなってしまうので拡大フラグを持つ
			this._pointSlot._isSmall = this._battler.isStateAffected(13);
			// アクターが混乱/魅了の時ポインタまで逆を向いてしまうので反転フラグを持つ
			// "対象がアクター"と"対象が混乱中"のXORをとる
			this._pointSlot._invertRate = ((this.scale.x < 0) ^ this._battler.isActor()) ? -1 : 1;
		} else {
			this.bitmap = null;
		}
	};
	
	Sprite_Battler.prototype.updateSelectionEffect = function() {
	    if (this._battler.isSelected()) {
	    	this._pointSlot._pointed = true;
	    }
	    else if (!this._battler.isSelected()) {
			this._pointSlot._pointed = false;
	    }
	};

	function Sprite_Point() {
	    this.initialize.apply(this, arguments);
	}
	Sprite_Point.prototype = Object.create(Sprite_Base.prototype);
	Sprite_Point.prototype.constructor = Sprite_Point;
	Sprite_Point.prototype.initialize = function() {
		Sprite_Base.prototype.initialize.call(this);
		this._pointed = false;
		this._isSmall = false;
		this._invertRate = 1;
	};
	Sprite_Point.prototype.update = function() {
		Sprite_Base.prototype.update.call(this);
	    var bitmap = ImageManager.loadSystem('IconSet');
	    var iconIndex = 91;
	    var pw = 32;
	    var ph = 32;
	    var sx = iconIndex % 16 * pw;
	    var sy = Math.floor(iconIndex / 16) * ph;
		this.bitmap.blt(bitmap, sx, sy, pw, ph, this.x, this.y);
		var size = 1;
		if (this._isSmall) size = 3.333;
		this.scale.x = size * this._invertRate;
		this.scale.y = size;
		if (this._pointed) this.show();
		else this.hide();
	};

})();