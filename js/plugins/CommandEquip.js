//==============================================================================
// ** Equip Battle Command
// by: Jeneeus Guruman
//------------------------------------------------------------------------------

var Imported = Imported || {};
var Jene = Jene || {};

/*:
 * @plugindesc Equip Battle Command v1.1.1
 * @author Jeneeus Guruman
 *
 * @param Unchangeable Types
 * @desc The equipment types that cannot be changed in battle.
 * Separate the IDs by spaces.
 * @default 
 *
 * @help
 *
 *     This plugin allows to access equip window to change equipment.
 *   
 *       Notes: 
 *       * Place this below scripts that alter the Equip layout but
 *       above other scripts.
 *
 *   Changelog:
 *
 *     * v1.1.1 Fixed a bug while using Yanfly's Equip Core that will
 *     clear equipment even the unremovable ones and optimized them
 *     even when set to not be optimized (special thanks to snorlord
 *     for the help).
 *     * v1.1.0: Now added "Unchangeable Types" parameter to exclude 
 *     some slots to enable equip changes in battle.
 *     * v1.0.2: Fixed a bug that won't refresh the equip item list 
 *     when the quantity of any equip altered outside of the equip 
 *     command.
 *     * v1.0.1: Now compatible with Yanfly's Equip Core.
 */

parameters = PluginManager.parameters('CommandEquip');

Jene.unchangeableTypes = String(parameters['Unchangeable Types']);

Jene.windowEquipSlotIsCurrentItemEnabled = Window_EquipSlot.prototype.isCurrentItemEnabled;

Window_EquipSlot.prototype.isCurrentItemEnabled = function() {
    var disabledSlots = [];
    for (i=0; i < Jene.unchangeableTypes.split(" ").length; i++) {
        disabledSlots.push(Number(Jene.unchangeableTypes.split(" ")[i]));
    }
    var etypeId = this._actor.equipSlots()[this.index()];
    if ($gameParty.inBattle() && disabledSlots.contains(etypeId)) {
        return false;
    }
    return this.isEnabled(this.index());
};

if (Imported.YEP_EquipCore) {

Jene.sceneBattleIsAnyInputWindowActiveYEP = Scene_Battle.prototype.isAnyInputWindowActive;
Scene_Battle.prototype.isAnyInputWindowActive = function() {
    return (Jene.sceneBattleIsAnyInputWindowActiveYEP.call(this) || this._slotWindow.active || this._equipItemWindow.active);
};

Jene.sceneBattleCreateAllWindowsYEP = Scene_Battle.prototype.createAllWindows;
Scene_Battle.prototype.createAllWindows = function() {
    Jene.sceneBattleCreateAllWindowsYEP.call(this);
    this.createSlotWindow();
    this.createEquipItemWindow();
}

function Window_BattleEquipSlot() {
    this.initialize.apply(this, arguments);
}
Window_BattleEquipSlot.prototype = Object.create(Window_EquipSlot.prototype);
Window_BattleEquipSlot.prototype.constructor = Window_BattleEquipSlot;
Window_BattleEquipSlot.prototype.maxCols = function() {
    return 2;
};
Window_BattleEquipSlot.prototype.maxItems = function() {
    return this._actor ? 2 : 0;
};
Window_BattleEquipSlot.prototype.processCursorMove = function(){
    if (this.isCursorMovable()) {
        if (Input.isTriggered('down')) this.callHandler('cancel');
        else if (Input.isTriggered('tab')) {
            BattleManager._showHelp = !BattleManager._showHelp;
            this.showHelpWindow();
        } else {
            Window_EquipSlot.prototype.processCursorMove.call(this);
        }
    }
}

Scene_Battle.prototype.createSlotWindow = function() {
    var wy = this._statusWindow.y;
    var ww = Graphics.boxWidth;
    var wh = this._statusWindow.height * 2 / 5;
    this._slotWindow = new Window_BattleEquipSlot(0, wy, ww, wh);
    this._slotWindow.setHandler('ok',       this.onSlotOk.bind(this));
    this._slotWindow.setHandler('cancel',   this.onSlotCancel.bind(this));
    this._slotWindow.hide();
    this.addWindow(this._slotWindow);
};

function Window_BattleEquipItem() {
    this.initialize.apply(this, arguments);
}
Window_BattleEquipItem.prototype = Object.create(Window_EquipItem.prototype);
Window_BattleEquipItem.prototype.constructor = Window_BattleEquipItem;
Window_BattleEquipItem.prototype.maxCols = function() {
    return 2;
};
// tabで説明欄の表示/非表示切り替え
Window_BattleEquipItem.prototype.processCursorMove = function() {
    Window_EquipItem.prototype.processCursorMove.call(this);
    if (this.isCursorMovable() && Input.isTriggered('tab')) {
            BattleManager._showHelp = !BattleManager._showHelp;
            this.showHelpWindow();
        }
};

Scene_Battle.prototype.createEquipItemWindow = function() {
    var wy = this._slotWindow.y + this._slotWindow.height;
    var ww = Graphics.boxWidth;
    var wh = this._statusWindow.height * 3 / 5;
    this._equipItemWindow = new Window_BattleEquipItem(0, wy, ww, wh);
    this._equipItemWindow.setHandler('ok',     this.onEquipItemOk.bind(this));
    this._equipItemWindow.setHandler('cancel', this.onEquipItemCancel.bind(this));
    this._slotWindow.setItemWindow(this._equipItemWindow);
    this._equipItemWindow.hide();
    this.addWindow(this._equipItemWindow);
};

Scene_Battle.prototype.refreshActor = function() {
    var actor = BattleManager.actor();
    this._slotWindow.setActor(actor);
    this._equipItemWindow.setActor(actor);
};

Scene_Battle.prototype.commandEquip = function() {
    this.refreshActor();
    this._itemWindow.deactivate();
    this._slotWindow.refresh();
    this._slotWindow.show();
    this._slotWindow.activate();
    this._slotWindow.select(0);
};

Scene_Battle.prototype.onSlotOk = function() {
    var slotId = this._slotWindow.index();
    Yanfly.Equip.Window_EquipItem_setSlotId.call(this._equipItemWindow, slotId);
    this._equipItemWindow.show();
    this._equipItemWindow.activate();
    this._equipItemWindow.select(0);
};

Scene_Battle.prototype.onSlotCancel = function() {
    this._slotWindow.deselect();
    this._slotWindow.deactivate();
    this._slotWindow.hide();
    this._itemWindow.activate();
};

Scene_Battle.prototype.commandEquipmentCancel = function() {
    this._equipCommandWindow.hide();
    this._equipStatusWindow.hide();
    this._equipItemWindow.hide();
    this._slotWindow.hide();
    this._compareWindow.hide();
    this._actorCommandWindow.activate();
    //this.selectPreviousCommand.bind(this);
};

Scene_Battle.prototype.onEquipItemOk = function() {
    SoundManager.playEquip();
    BattleManager.actor().changeEquip(this._slotWindow.index(), this._equipItemWindow.item());
    // 魔法剣ステート解除
    BattleManager.actor().resetSwordMagi();
    this._slotWindow.activate();
    this._slotWindow.refresh();
    this._equipItemWindow.deselect();
    this._equipItemWindow.refresh();
    this._equipItemWindow.hide();
};

// 魔法剣ステート解除処理
Game_BattlerBase.prototype.resetSwordMagi = function() {
    var swordMagiState = [51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74];
    for (var i = 0; i < swordMagiState.length; i++) {
        this.removeState(swordMagiState[i]);
    }
};

Scene_Battle.prototype.onEquipItemCancel = function() {
    this._slotWindow.activate();
    this._equipItemWindow.hide();
};

}
/*
else {

Window_ActorCommand.prototype.addEquipCommand = function() {
    this.addCommand(TextManager.equip, 'equip');
};

Jene.windowActorCommandMakeCommandList = Window_ActorCommand.prototype.makeCommandList;

Window_ActorCommand.prototype.makeCommandList = function() {
    Jene.windowActorCommandMakeCommandList.call(this);
    if (this._actor) {
        this.addEquipCommand();
    }
};

Jene.sceneBattleIsAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;

Scene_Battle.prototype.isAnyInputWindowActive = function() {
    return (Jene.sceneBattleIsAnyInputWindowActive.call(this) || this._equipCommandWindow.active || this._slotWindow.active || this._equipItemWindow.active);
};

Jene.sceneBattleCreateAllWindows = Scene_Battle.prototype.createAllWindows;

Scene_Battle.prototype.createAllWindows = function() {
    Jene.sceneBattleCreateAllWindows.call(this);
    this.createEquipStatusWindow();
    this.createEquipCommandWindow();
    this.createSlotWindow();
    this.createEquipItemWindow();
}

Jene.sceneBattleCreateActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;

Scene_Battle.prototype.createActorCommandWindow = function() {
    Jene.sceneBattleCreateActorCommandWindow.call(this);
    this._actorCommandWindow.setHandler('equip',  this.commandEquipment.bind(this));
    this.addWindow(this._actorCommandWindow);
};

Scene_Battle.prototype.createEquipStatusWindow = function() {
    this._equipStatusWindow = new Window_EquipStatus(0, this._helpWindow.height);
    $gameParty.members().forEach(function(actor) {
        ImageManager.loadFace(actor.faceName());
    }, this._equipStatusWindow);
    this._equipStatusWindow.hide();
    this.addWindow(this._equipStatusWindow);
};

Scene_Battle.prototype.createEquipCommandWindow = function() {
    var wx = this._equipStatusWindow.width;
    var wy = this._helpWindow.height;
    var ww = Graphics.boxWidth - this._equipStatusWindow.width;
    this._equipCommandWindow = new Window_EquipCommand(wx, wy, ww);
    this._equipCommandWindow.setHandler('equip',    this.commandEquip.bind(this));
    this._equipCommandWindow.setHandler('optimize', this.commandOptimize.bind(this));
    this._equipCommandWindow.setHandler('clear',    this.commandClear.bind(this));
    this._equipCommandWindow.setHandler('cancel',   this.commandEquipmentCancel.bind(this));
    this._equipCommandWindow.deactivate();
    this._equipCommandWindow.hide();
    this.addWindow(this._equipCommandWindow);
};

Scene_Battle.prototype.createSlotWindow = function() {
    var wx = this._equipStatusWindow.width;
    var wy = this._equipCommandWindow.y + this._equipCommandWindow.height;
    var ww = Graphics.boxWidth - this._equipStatusWindow.width;
    var wh = this._equipStatusWindow.height - this._equipCommandWindow.height;
    this._slotWindow = new Window_EquipSlot(wx, wy, ww, wh);
    this._slotWindow.setHelpWindow(this._helpWindow);
    this._slotWindow.setStatusWindow(this._equipStatusWindow);
    this._slotWindow.setHandler('ok',       this.onSlotOk.bind(this));
    this._slotWindow.setHandler('cancel',   this.onSlotCancel.bind(this));
    this._slotWindow.hide();
    this.addWindow(this._slotWindow);
};

Scene_Battle.prototype.createEquipItemWindow = function() {
    var wx = 0;
    var wy = this._equipStatusWindow.y + this._equipStatusWindow.height;
    var ww = Graphics.boxWidth;
    var wh = Graphics.boxHeight - wy;
    this._equipItemWindow = new Window_EquipItem(wx, wy, ww, wh);
    this._equipItemWindow.setHelpWindow(this._helpWindow);
    this._equipItemWindow.setStatusWindow(this._equipStatusWindow);
    this._equipItemWindow.setHandler('ok',     this.onEquipItemOk.bind(this));
    this._equipItemWindow.setHandler('cancel', this.onEquipItemCancel.bind(this));
    this._slotWindow.setItemWindow(this._equipItemWindow);
    this._equipItemWindow.hide();
    this.addWindow(this._equipItemWindow);
};

Scene_Battle.prototype.refreshActor = function() {
    var actor = BattleManager.actor();
    this._equipStatusWindow.setActor(actor);
    this._slotWindow.setActor(actor);
    this._equipItemWindow.setActor(actor);
};

Scene_Battle.prototype.commandEquipment = function() {
    this.refreshActor();
    this._helpWindow.show();
    this._equipCommandWindow.refresh();
    this._equipCommandWindow.show();
    this._equipCommandWindow.activate();
    this._equipStatusWindow.refresh();
    this._equipStatusWindow.show();
    this._slotWindow.refresh();
    this._slotWindow.show();
    this._equipItemWindow.show();
    this._equipItemWindow.refresh();
    this._equipCommandWindow.select(0);
};

Scene_Battle.prototype.commandEquip = function() {
    this._slotWindow.refresh();
    this._slotWindow.activate();
};

Scene_Battle.prototype.commandOptimize = function() {
    SoundManager.playEquip();
    BattleManager.actor().optimizeEquipments();
    this._equipStatusWindow.refresh();
    this._slotWindow.refresh();
    this._equipCommandWindow.activate();
};

Scene_Battle.prototype.commandClear = function() {
    SoundManager.playEquip();
    BattleManager.actor().clearEquipments();
    this._equipStatusWindow.refresh();
    this._slotWindow.refresh();
    this._equipCommandWindow.activate();
};

Scene_Battle.prototype.onSlotOk = function() {
    this._equipItemWindow.activate();
    this._equipItemWindow.select(0);
};

Scene_Battle.prototype.onSlotCancel = function() {
    this._slotWindow.deselect();
    this._equipCommandWindow.activate();
};

Scene_Battle.prototype.commandEquipmentCancel = function() {
    this._helpWindow.hide();
    this._equipCommandWindow.hide();
    this._equipStatusWindow.hide();
    this._equipItemWindow.hide();
    this._slotWindow.hide();
    this._actorCommandWindow.activate();
    //this.selectPreviousCommand.bind(this);
};

Scene_Battle.prototype.onEquipItemOk = function() {
    SoundManager.playEquip();
    BattleManager.actor().changeEquip(this._slotWindow.index(), this._equipItemWindow.item());
    this._slotWindow.activate();
    this._slotWindow.refresh();
    this._equipItemWindow.deselect();
    this._equipItemWindow.refresh();
    this._equipStatusWindow.refresh();
};

Scene_Battle.prototype.onEquipItemCancel = function() {
    this._slotWindow.activate();
};

}*/
