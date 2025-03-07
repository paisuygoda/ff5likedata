/*:
* @plugindesc スキルセット画面
* @author paisuygoda
* @help メインメニューからアビリティ装備画面へ移動
*
* @param Skill Set Command Name
* @desc アビリティ項目の名称
* @default アビリティ
*/

// Params
var PS_RawParams = {};
var PS_Param = {};
PS_RawParams = PluginManager.parameters('SkillSetCommand');
PS_Param.skillequip = String(PS_RawParams['Skill Set Command Name']);

//-----------------------------------------------------------------------------
// Scene
//-----------------------------------------------------------------------------

var _PS_SM_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
Scene_Menu.prototype.createCommandWindow = function()
{
	_PS_SM_createCommandWindow.call(this);
	if ( PS_Param.skillequip )
	{
		this._commandWindow.setHandler('skillEquip', this.commandPersonal.bind(this));
	}
};

var _PS_SM_onPersonalOk = Scene_Menu.prototype.onPersonalOk;
Scene_Menu.prototype.onPersonalOk = function() {
    switch ( this._commandWindow.currentSymbol() ) {
	case 'skillEquip':
		SceneManager.push(Scene_SkillEquip);
		break;
	default:
		_PS_SM_onPersonalOk.call(this);
		break;
	}
};

//-----------------------------------------------------------------------------
// Scene_SkillEquip
//
// The scene class of the skill equipment screen.

function Scene_SkillEquip() {
    this.initialize.apply(this, arguments);
}

Scene_SkillEquip.prototype = Object.create(Scene_MenuBase.prototype);
Scene_SkillEquip.prototype.constructor = Scene_SkillEquip;

Scene_SkillEquip.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_SkillEquip.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createHelpWindow();
    this.createStatusWindow();
    this.createCommandWindow();
    this.createSlotWindow();
    this.createItemWindow();
    this.refreshActor();
};

Scene_SkillEquip.prototype.createStatusWindow = function() {
    this._statusWindow = new Window_SkillEquipStatus(0, this._helpWindow.height);
    this.addWindow(this._statusWindow);
};

Scene_SkillEquip.prototype.createCommandWindow = function() {
    var wx = this._statusWindow.width;
    var wy = this._helpWindow.height;
    var ww = Graphics.boxWidth - this._statusWindow.width;
    this._commandWindow = new Window_SkillEquipCommand(wx, wy, ww);
    this._commandWindow.setHelpWindow(this._helpWindow);
    this._commandWindow.setHandler('equip',    this.commandEquip.bind(this));
    this._commandWindow.setHandler('clear',    this.commandClear.bind(this));
    this._commandWindow.setHandler('cancel',   this.popScene.bind(this));
    this._commandWindow.setHandler('pagedown', this.nextActor.bind(this));
    this._commandWindow.setHandler('pageup',   this.previousActor.bind(this));
    this.addWindow(this._commandWindow);
};

Scene_SkillEquip.prototype.createSlotWindow = function() {
    var wx = this._statusWindow.width;
    var wy = this._commandWindow.y + this._commandWindow.height;
    var ww = Graphics.boxWidth - this._statusWindow.width;
    var wh = this._statusWindow.height - this._commandWindow.height;
    this._slotWindow = new Window_SkillEquipSlot(wx, wy, ww, wh);
    this._slotWindow.setHelpWindow(this._helpWindow);
    this._slotWindow.setStatusWindow(this._statusWindow);
    this._slotWindow.setHandler('ok',       this.onSlotOk.bind(this));
    this._slotWindow.setHandler('cancel',   this.onSlotCancel.bind(this));
    this.addWindow(this._slotWindow);
};

Scene_SkillEquip.prototype.createItemWindow = function() {
    var wx = 0;
    var wy = this._statusWindow.y + this._statusWindow.height;
    var ww = Graphics.boxWidth;
    var wh = Graphics.boxHeight - wy;
    this._itemWindow = new Window_SkillEquipItem(wx, wy, ww, wh);
    this._itemWindow.setHelpWindow(this._helpWindow);
    this._itemWindow.setStatusWindow(this._statusWindow);
    this._itemWindow.setHandler('ok',     this.onItemOk.bind(this));
    this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
    this._slotWindow.setItemWindow(this._itemWindow);
    this.addWindow(this._itemWindow);
};

Scene_SkillEquip.prototype.refreshActor = function() {
    var actor = this.actor();
    this._statusWindow.setActor(actor);
    this._slotWindow.setActor(actor);
    this._itemWindow.setActor(actor);
};

Scene_SkillEquip.prototype.commandEquip = function() {
    this._slotWindow.activate();
    this._slotWindow.select(0);
};

Scene_SkillEquip.prototype.commandClear = function() {
    SoundManager.playEquip();
    this.actor().clearEquipments();
    this._statusWindow.refresh();
    this._slotWindow.refresh();
    this._commandWindow.activate();
};

Scene_SkillEquip.prototype.onSlotOk = function() {
    this._itemWindow.activate();
    this._itemWindow.select(0);
};

Scene_SkillEquip.prototype.onSlotCancel = function() {
    this._slotWindow.deselect();
    this._commandWindow.activate();
};

Scene_SkillEquip.prototype.onItemOk = function() {
    SoundManager.playEquip();
    this.actor().changeEquip(this._slotWindow.index(), this._itemWindow.item());
    this._slotWindow.activate();
    this._slotWindow.refresh();
    this._itemWindow.deselect();
    this._itemWindow.refresh();
    this._statusWindow.refresh();
};

Scene_SkillEquip.prototype.onItemCancel = function() {
    this._slotWindow.activate();
    this._itemWindow.deselect();
};

Scene_SkillEquip.prototype.onActorChange = function() {
    this.refreshActor();
    this._commandWindow.activate();
};




//-----------------------------------------------------------------------------
// Window
//-----------------------------------------------------------------------------

var _PS_WMC_addMainCommands = Window_MenuCommand.prototype.addMainCommands;
Window_MenuCommand.prototype.addMainCommands = function() {
    var enabled = this.areMainCommandsEnabled();
    _PS_WMC_addMainCommands.call(this);
    this.addCommand(PS_Param.skillequip, 'skillEquip', enabled);
};

//-----------------------------------------------------------------------------
// Window_SkillEquipStatus
//
// The window for displaying parameter changes on the equipment screen.

function Window_SkillEquipStatus() {
    this.initialize.apply(this, arguments);
}

Window_SkillEquipStatus.prototype = Object.create(Window_Base.prototype);
Window_SkillEquipStatus.prototype.constructor = Window_SkillEquipStatus;

Window_SkillEquipStatus.prototype.initialize = function(x, y) {
    var width = this.windowWidth();
    var height = this.windowHeight();
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this._actor = null;
    this._tempActor = null;
    this.refresh();
};

Window_SkillEquipStatus.prototype.windowWidth = function() {
    return 312;
};

Window_SkillEquipStatus.prototype.windowHeight = function() {
    return this.fittingHeight(this.numVisibleRows());
};

Window_SkillEquipStatus.prototype.numVisibleRows = function() {
    return 7;
};

Window_SkillEquipStatus.prototype.setActor = function(actor) {
    if (this._actor !== actor) {
        this._actor = actor;
        this.refresh();
    }
};

Window_SkillEquipStatus.prototype.refresh = function() {
    this.contents.clear();
    if (this._actor) {
        this.drawActorName(this._actor, this.textPadding(), 0);
        for (var i = 0; i < 6; i++) {
            this.drawItem(0, this.lineHeight() * (1 + i), 2 + i);
        }
    }
};

Window_SkillEquipStatus.prototype.setTempActor = function(tempActor) {
    if (this._tempActor !== tempActor) {
        this._tempActor = tempActor;
        this.refresh();
    }
};

Window_SkillEquipStatus.prototype.drawItem = function(x, y, paramId) {
    this.drawParamName(x + this.textPadding(), y, paramId);
    if (this._actor) {
        this.drawCurrentParam(x + 140, y, paramId);
    }
    this.drawRightArrow(x + 188, y);
    if (this._tempActor) {
        this.drawNewParam(x + 222, y, paramId);
    }
};

Window_SkillEquipStatus.prototype.drawParamName = function(x, y, paramId) {
    this.changeTextColor(this.systemColor());
    this.drawText(TextManager.param(paramId), x, y, 120);
};

Window_SkillEquipStatus.prototype.drawCurrentParam = function(x, y, paramId) {
    this.resetTextColor();
    this.drawText(this._actor.param(paramId), x, y, 48, 'right');
};

Window_SkillEquipStatus.prototype.drawRightArrow = function(x, y) {
    this.changeTextColor(this.systemColor());
    this.drawText('\u2192', x, y, 32, 'center');
};

Window_SkillEquipStatus.prototype.drawNewParam = function(x, y, paramId) {
    var newValue = this._tempActor.param(paramId);
    var diffvalue = newValue - this._actor.param(paramId);
    this.changeTextColor(this.paramchangeTextColor(diffvalue));
    this.drawText(newValue, x, y, 48, 'right');
};

//-----------------------------------------------------------------------------
// Window_SkillEquipCommand
//
// The window for selecting a command on the equipment screen.

function Window_SkillEquipCommand() {
    this.initialize.apply(this, arguments);
}

Window_SkillEquipCommand.prototype = Object.create(Window_HorzCommand.prototype);
Window_SkillEquipCommand.prototype.constructor = Window_SkillEquipCommand;

Window_SkillEquipCommand.prototype.initialize = function(x, y, width) {
    this._windowWidth = width;
    Window_HorzCommand.prototype.initialize.call(this, x, y);
};

Window_SkillEquipCommand.prototype.windowWidth = function() {
    return this._windowWidth;
};

Window_SkillEquipCommand.prototype.maxCols = function() {
    return 3;
};

Window_SkillEquipCommand.prototype.makeCommandList = function() {
    this.addCommand(TextManager.equip2,   'equip');
    this.addCommand(TextManager.clear,    'clear');
};

//-----------------------------------------------------------------------------
// Window_SkillEquipSlot
//
// The window for selecting an equipment slot on the equipment screen.

function Window_SkillEquipSlot() {
    this.initialize.apply(this, arguments);
}

Window_SkillEquipSlot.prototype = Object.create(Window_Selectable.prototype);
Window_SkillEquipSlot.prototype.constructor = Window_SkillEquipSlot;

Window_SkillEquipSlot.prototype.initialize = function(x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this._actor = null;
    this.refresh();
};

Window_SkillEquipSlot.prototype.setActor = function(actor) {
    if (this._actor !== actor) {
        this._actor = actor;
        this.refresh();
    }
};

Window_SkillEquipSlot.prototype.update = function() {
    Window_Selectable.prototype.update.call(this);
    if (this._itemWindow) {
        this._itemWindow.setSlotId(this.index());
    }
};

Window_SkillEquipSlot.prototype.maxItems = function() {
    return this._actor ? this._actor.equipSlots().length : 0;
};

Window_SkillEquipSlot.prototype.item = function() {
    return this._actor ? this._actor.equips()[this.index()] : null;
};

Window_SkillEquipSlot.prototype.drawItem = function(index) {
    if (this._actor) {
        var rect = this.itemRectForText(index);
        this.changeTextColor(this.systemColor());
        this.changePaintOpacity(this.isEnabled(index));
        this.drawText(this.slotName(index), rect.x, rect.y, 138, this.lineHeight());
        this.drawItemName(this._actor.equips()[index], rect.x + 138, rect.y);
        this.changePaintOpacity(true);
    }
};

Window_SkillEquipSlot.prototype.slotName = function(index) {
    var slots = this._actor.equipSlots();
    return this._actor ? $dataSystem.equipTypes[slots[index]] : '';
};

Window_SkillEquipSlot.prototype.isEnabled = function(index) {
    return this._actor ? this._actor.isEquipChangeOk(index) : false;
};

Window_SkillEquipSlot.prototype.isCurrentItemEnabled = function() {
    return this.isEnabled(this.index());
};

Window_SkillEquipSlot.prototype.setStatusWindow = function(statusWindow) {
    this._statusWindow = statusWindow;
    this.callUpdateHelp();
};

Window_SkillEquipSlot.prototype.setItemWindow = function(itemWindow) {
    this._itemWindow = itemWindow;
    this.update();
};

Window_SkillEquipSlot.prototype.updateHelp = function() {
    Window_Selectable.prototype.updateHelp.call(this);
    this.setHelpWindowItem(this.item());
    if (this._statusWindow) {
        this._statusWindow.setTempActor(null);
    }
};

//-----------------------------------------------------------------------------
// Window_SkillEquipItem
//
// The window for selecting an equipment item on the equipment screen.

function Window_SkillEquipItem() {
    this.initialize.apply(this, arguments);
}

Window_SkillEquipItem.prototype = Object.create(Window_ItemList.prototype);
Window_SkillEquipItem.prototype.constructor = Window_SkillEquipItem;

Window_SkillEquipItem.prototype.initialize = function(x, y, width, height) {
    Window_ItemList.prototype.initialize.call(this, x, y, width, height);
    this._actor = null;
    this._slotId = 0;
};

Window_SkillEquipItem.prototype.setActor = function(actor) {
    if (this._actor !== actor) {
        this._actor = actor;
        this.refresh();
        this.resetScroll();
    }
};

Window_SkillEquipItem.prototype.setSlotId = function(slotId) {
    if (this._slotId !== slotId) {
        this._slotId = slotId;
        this.refresh();
        this.resetScroll();
    }
};

Window_SkillEquipItem.prototype.includes = function(item) {
    if (item === null) {
        return true;
    }
    if (this._slotId < 0 || item.etypeId !== this._actor.equipSlots()[this._slotId]) {
        return false;
    }
    return this._actor.canEquip(item);
};

Window_SkillEquipItem.prototype.isEnabled = function(item) {
    return true;
};

Window_SkillEquipItem.prototype.selectLast = function() {
};

Window_SkillEquipItem.prototype.setStatusWindow = function(statusWindow) {
    this._statusWindow = statusWindow;
    this.callUpdateHelp();
};

Window_SkillEquipItem.prototype.updateHelp = function() {
    Window_ItemList.prototype.updateHelp.call(this);
    if (this._actor && this._statusWindow) {
        var actor = JsonEx.makeDeepCopy(this._actor);
        actor.forceChangeEquip(this._slotId, this.item());
        this._statusWindow.setTempActor(actor);
    }
};

Window_SkillEquipItem.prototype.playOkSound = function() {
};