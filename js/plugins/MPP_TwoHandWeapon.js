//=============================================================================
// MPP_TwoHandWeapon.js
//=============================================================================
// Copyright (c) 2015 Mokusei Penguin
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc 【ver.1.0】両手持ち武器を設定できます。
 * @author 木星ペンギン
 *
 * @help 通常、装備タイプ「盾」を封印しても二刀流時は武器を二つ持ててしまいます。
 * 
 * それを、装備タイプ「盾」を封印した場合、2番目のスロットを封印するように
 * 変更します。
 * 
 * ================================
 * 制作 : 木星ペンギン
 * URL : http://woodpenguin.blog.fc2.com/
 * 
 */

(function() {
    
//-----------------------------------------------------------------------------
// Game_Actor

//238
var _Game_Actor_isEquipChangeOk = Game_Actor.prototype.isEquipChangeOk;
Game_Actor.prototype.isEquipChangeOk = function(slotId) {
    return (_Game_Actor_isEquipChangeOk.call(this, slotId) &&
            !this.isSealedSlot(slotId));
};

//287
Game_Actor.prototype.releaseUnequippableItems = function(forcing) {
    
    for (;;) {
        var slots = this.equipSlots();
        var equips = this.equips();
        var changed = false;
        for (var i = 0; i < equips.length; i++) {
            var item = equips[i];
            var isBareHand = item && item.id == 1;
            if (item && (((!this.canEquip(item) || item.etypeId !== slots[i]) && !isBareHand)
                        || this.isSealedSlot(i))) {
                if (!forcing) {
                    this.tradeItemWithParty(null, item);
                }
                this._equips[i].setObject(null);
                changed = true;
            }
        }
        if (!changed) {
            break;
        }
    }
};

Game_Actor.prototype.isSealedSlot = function(slotId) {
    return (slotId === 1 && this.isEquipTypeSealed(2));
};

})();
