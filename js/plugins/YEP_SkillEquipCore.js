//=============================================================================
// Yanfly Engine Plugins - SkillEquip Core
// YEP_SkillEquipCore.js
//=============================================================================

var Imported = Imported || {};
Imported.YEP_SkillEquipCore = true;

var Yanfly = Yanfly || {};
Yanfly.SkillEquip = Yanfly.SkillEquip || {};

//=============================================================================
/*:
 * @plugindesc v1.18 Allows for the SkillEquipment system to be more flexible to
 * allow for unique SkillEquipment slots per class.
 * @author Yanfly Engine Plugins
 *
 * @param ---General---
 * @default
 *
 * @param Text Align
 * @parent ---General---
 * @type combo
 * @option left
 * @option center
 * @option right
 * @desc How to align the text for the command window.
 * left     center     right
 * @default center
 *
 * @param Finish Command
 * @parent ---General---
 * @desc The command text used for exiting the SkillEquip scene.
 * Leave empty to not include this command.
 * @default Finish
 *
 * @param Remove Text
 * @parent ---General---
 * @desc The text used to display the "Remove" command in the SkillEquip
 * item list.
 * @default Remove
 *
 * @param Remove Icon
 * @parent ---General---
 * @type number
 * @min 0
 * @desc The icon used to display next to the "Remove" command in
 * the SkillEquip item list.
 * @default 16
 *
 * @param Empty Text
 * @parent ---General---
 * @desc The text used to display an "Empty" piece of SkillEquipment.
 * @default <Empty>
 *
 * @param Empty Icon
 * @parent ---General---
 * @type number
 * @min 0
 * @desc The icon used to display next to the "Empty" piece of
 * SkillEquipment in the SkillEquipment list.
 * @default 16
 *
 * @param ---Rules---
 * @default
 *
 * @param Ability Item Slot
 * @parent ---Rules---
 * @type number
 * @min 1
 * @max 100
 * @desc アビリティアイテムの装備タイプ
 * @default 6
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * This plugin alters various aspects regarding SkillEquipment handling. The changes
 * are as listed:
 *
 * 1. Scene_SkillEquip
 * Scene_SkillEquip has been modified to look differently. This is primarily done to
 * make the main menu scenes look uniform and keep everything familiar for
 * players. Furthermore, the command window has been adjusted to be better fit
 * for extension plugins in the future that may add commands to the command
 * window and/or the scene.
 *
 * 2. SkillEquipment Type Handling
 * Characters will no longer have one universal SkillEquipment slot setting. Now,
 * different classes can use different setups by simply adding a few notetags
 * to the class notebox. Furthermore, SkillEquipment types in the past with matching
 * names would be treated as separate types. Now, SkillEquipment types with matching
 * names will be treated as the same type.
 *
 * 3. SkillEquipment Rulings
 * Now, certain SkillEquipment types can or cannot be removed. For example, this
 * plugin can set it so that the Weapon slot must always have something
 * SkillEquipped and that the player cannot manually leave it empty (the game, on
 * the other hand, can achieve this through events). In addition to that,
 * optimizing SkillEquipment can be restricted for certain SkillEquipment types, which
 * are better off being decided manually (such as accessories).
 *
 * 4. Parameter Control
 * SkillEquipment parameters can now to be adjusted through notetags to have a large
 * value or customized value (through code). This allows for SkillEquipment to no
 * longer be static items, but instead, SkillEquipment can now be dynamic and may
 * change over the course of the game.
 *
 * Note: Item Core Users
 * For users using the Item Core plugin and the new Item Scene layout option,
 * the Item Info Window is now added to the SkillEquip Scene. Pressing Left/Right
 * will toggle the stat comparison window with the info window. Pressing Tab on
 * the keyboard will also switch them as well as clicking on those windows.
 *
 * ============================================================================
 * Notetags
 * ============================================================================
 *
 * You can use the following notetags to change a class's SkillEquipment setup.
 *
 * Class Notetags:
 *   <SkillEquip Slot: x>      Example: <SkillEquip Slot: 1, 2, 3, 4, 5, 5, 5, 5>
 *   <SkillEquip Slot: x, x, x>
 *   Changes this class's SkillEquipment slots to x. Using repeating numbers makes
 *   it so that SkillEquipment type is duplicated and that the class can SkillEquip
 *   multiple SkillEquipment of that type. To find the SkillEquipment Type ID, go to your
 *   database's Types tab and look for the ID type.
 *
 *   If you don't like the above method for setting SkillEquipment slots, you can
 *   use the following notetags instead:
 *
 *   <SkillEquip Slot>         Example: <SkillEquip Slot>
 *    string                        Weapon
 *    string                        Armor
 *    string                        Accessory
 *    string                        Accessory
 *   </SkillEquip Slot>                 </SkillEquip Slot>
 *   Replace 'string' with the SkillEquipment type's name entry. This is case
 *   sensitive so if the string does not match a name entry perfectly, the slot
 *   will not be granted to the class. Multiple copies of a name entry would
 *   mean the class can SkillEquip multiple SkillEquipment of that type. Everything works
 *   the same as the previous notetag.
 *
 * Weapon and Armor Notetags:
 *   <stat: +x>
 *   <stat: -x>
 *   Allows the piece of weapon or armor to gain or lose x amount of stat.
 *   Replace "stat" with "hp", "mp", "atk", "def", "mat", "mdf", "agi", or
 *   "luk" to alter that specific stat. This allows the piece of SkillEquipment
 *   to go past the editor's default limitation so long as the maximum value
 *   allows for it. Changes made here alter the base parameters.
 *
 * ============================================================================
 * Lunatic Mode - Custom Parameters
 * ============================================================================
 *
 *   <Custom Parameters>  Example: <Custom Parameters>
 *    code                          atk = $gameVariables.value(1);
 *    code                          mat = atk / 2;
 *    code                          all = $gameParty.members().length;
 *    code                         </Custom Parameters>
 *   </Code Parameters>
 *   Allows for parameters to have custom rates adjusted by code. The following
 *   parameters are defined: 'maxhp', 'maxmp', 'atk', 'def', 'mat', 'mdf',
 *   'agi', 'luk', and 'all'. The 'all' parameter will affect all parameters.
 *   Changes made here do not alter the base parameters, but instead, are added
 *   onto the base parameters.
 **/
//=============================================================================

//=============================================================================
// Parameter Variables
//=============================================================================

Yanfly.Parameters = PluginManager.parameters("YEP_SkillEquipCore");
Yanfly.Param = Yanfly.Param || {};
Yanfly.Icon = Yanfly.Icon || {};

Yanfly.Param.SkillEquipTextAlign = String(Yanfly.Parameters["Text Align"]);
Yanfly.Param.SkillEquipFinishCmd = String(Yanfly.Parameters["Finish Command"]);
Yanfly.Param.SkillEquipRemoveText = String(Yanfly.Parameters["Remove Text"]);
Yanfly.Icon.RemoveSkillEquip = Number(Yanfly.Parameters["Remove Icon"]);
Yanfly.Param.SkillEquipEmptyText = String(Yanfly.Parameters["Empty Text"]);
Yanfly.Icon.EmptySkillEquip = Number(Yanfly.Parameters["Empty Icon"]);
Yanfly.Param.AbilityItemSlot = Number(Yanfly.Parameters["Ability Item Slot"]);

//=============================================================================
// DataManager
//=============================================================================

Yanfly.SkillEquip.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
  if (!Yanfly.SkillEquip.DataManager_isDatabaseLoaded.call(this)) return false;
  if (!Yanfly._loaded_YEP_SkillEquipCore) {
    DataManager.processSkillEquipNotetags1($dataClasses);
    Yanfly._loaded_YEP_SkillEquipCore = true;
  }
  return true;
};

DataManager.processSkillEquipNotetags1 = function (group) {
  var note1 = /<(?:SkillEquip SLOT|SkillEquip slots):[ ]*(\d+)>/i;
  var note2 = /<(?:JobAbility):[ ]*(\d+)>/i;
  for (var n = 1; n < group.length; n++) {
    var obj = group[n];
    var notedata = obj.note.split(/[\r\n]+/);

    obj.SkillEquipSlots = [];
    var SkillEquipSlots = false;
    var num = 2;
    obj.jobability = null;

    for (var i = 0; i < notedata.length; i++) {
      var line = notedata[i];
      if (line.match(note1)) {
        var num = parseInt(RegExp.$1);
      } else if (line.match(note2)) {
        obj.jobability = parseInt(RegExp.$1);
      }
    }
    this.setDefaultSkillEquipSlots(obj, num);
  }
};

DataManager.setDefaultSkillEquipSlots = function (obj, num) {
  obj.SkillEquipSlots = [];
  for (var i = 0; i < num; i++) {
    var slotId = Yanfly.Param.AbilityItemSlot;
    if (slotId >= 0) obj.SkillEquipSlots.push(slotId);
  }
};

//=============================================================================
// Game_Interpreter
//=============================================================================

// Change Equipment
Game_Interpreter.prototype.command319 = function () {
  var actor = $gameActors.actor(this._params[0]);
  if (!actor) return true;
  var index = actor.equipSlots().indexOf(this._params[1]) + 1;
  actor.changeEquipById(index, this._params[2]);
  return true;
};

//=============================================================================
// Game_Actor
//=============================================================================

Gap_initMembers = Game_Actor.prototype.initMembers;
Game_Actor.prototype.initMembers = function () {
  Gap_initMembers.call(this);
  this._SkillEquips = [];
  this._counterType = 0;
};

Game_Actor.prototype.initSkillEquips = function (SkillEquips) {
  var SkillEquips = this.convertInitSkillEquips(SkillEquips);
  this.SkillEquipInitSkillEquips(SkillEquips);
  this.releaseUnSkillEquippableItems(true);
  this.recoverAll();
  this.abrefresh();
};

Game_Actor.prototype.convertInitSkillEquips = function (SkillEquips) {
  var items = [];
  for (var i = 0; i < SkillEquips.length; ++i) {
    var SkillEquipId = SkillEquips[i];
    if (SkillEquipId <= 0) continue;
    var SkillEquipType = $dataSystem.equipTypes[i + 1];
    if (
      SkillEquipType === $dataSystem.equipTypes[1] ||
      (i === 1 && this.isDualWield())
    ) {
      var SkillEquip = $dataWeapons[SkillEquipId];
    } else {
      var SkillEquip = $dataArmors[SkillEquipId];
    }
    items.push(SkillEquip);
  }
  return items;
};

Game_Actor.prototype.SkillEquipInitSkillEquips = function (SkillEquips) {
  var slots = this.skillEquipSlots();
  var maxSlots = slots.length;
  this._SkillEquips = [];
  for (var i = 0; i < maxSlots; ++i) {
    this._SkillEquips[i] = new Game_Item();
  }
  for (var i = 0; i < maxSlots; ++i) {
    var slotType = slots[i];
    var SkillEquip = this.grabInitSkillEquips(SkillEquips, slotType);
    if (this.canSkillEquip(SkillEquip))
      this._SkillEquips[i].setObject(SkillEquip);
  }
};

Game_Actor.prototype.grabInitSkillEquips = function (SkillEquips, slotType) {
  var item = null;
  for (var i = 0; i < SkillEquips.length; ++i) {
    var SkillEquip = SkillEquips[i];
    if (!SkillEquip) continue;
    if (slotType === 1 && DataManager.isWeapon(SkillEquip)) {
      item = SkillEquip;
      break;
    } else if (SkillEquip.etypeId === slotType) {
      item = SkillEquip;
      break;
    }
  }
  if (item) SkillEquips[i] = null;
  return item;
};

Game_Actor.prototype.skillEquipSlots = function () {
  // var abid = Yanfly.Param.AbilityItemSlot;
  // var slots = [abid, abid, abid, abid];
  var slots = this.currentClass().SkillEquipSlots.slice();
  return slots;
};

Game_Actor.prototype.skillEquips = function () {
  for (var i = 0; i < this.currentClass().SkillEquipSlots.length; ++i) {
    if (this._SkillEquips[i] === undefined || this._SkillEquips[i] === null) {
      this._SkillEquips[i] = new Game_Item();
    }
    if (i === 0) {
      if (this.currentClass().jobability != null) {
        this._SkillEquips[i] = new Game_Item(
          $dataArmors[this.currentClass().jobability]
        );
      } else if (
        this._SkillEquips[i].isArmor() &&
        this._SkillEquips[i].itemId() !== this.currentClass().jobability
      ) {
        this._SkillEquips[i] = new Game_Item();
      }
    }
  }

  return this._SkillEquips.map(function (item) {
    return item.object();
  });
};

Game_Actor.prototype.changeSkillEquip = function (slotId, item) {
  if (!this._SkillEquips[slotId]) this._SkillEquips[slotId] = new Game_Item();
  if (
    this.tradeItemWithParty(item, this.skillEquips()[slotId]) &&
    (!item || this.skillEquipSlots()[slotId] === item.etypeId)
  ) {
    if (item && item.traits.length > 0)
      item.traits[0]["priority"] = 10 - slotId;
    this._SkillEquips[slotId].setObject(item);
    this.abrefresh();
  }
  // パッシブステートをリセットする（パッシブステート参照時に再読み込みされる）
  this._passiveStatesRaw = null;
};

// ジョブアビリティアイテムは入手しないようにする
Game_Actor.prototype.tradeItemWithParty = function (newItem, oldItem) {
  if (newItem && !$gameParty.hasItem(newItem)) {
    return false;
  } else {
    if (!oldItem || oldItem.etypeId !== 6 || oldItem.atypeId !== 11)
      $gameParty.gainItem(oldItem, 1);
    $gameParty.loseItem(newItem, 1);
    return true;
  }
};

Game_Actor.prototype.forceChangeSkillEquip = function (slotId, item) {
  if (!this._SkillEquips[slotId]) {
    this._SkillEquips[slotId] = new Game_Item();
    this._SkillEquips[slotId].setEquip(this.skillEquipSlots()[slotId] === 1, 0);
  }
  this._SkillEquips[slotId].setObject(item);
  this.releaseUnequippableAbs(true);
  this.releaseUnequippableItems(true);
  this.abrefresh();
  // パッシブステートをリセットする（パッシブステート参照時に再読み込みされる）
  this._passiveStatesRaw = null;
};

Game_Actor.prototype.releaseUnequippableAbs = function (forcing) {
  // TODO: 現在のジョブアビリティは残すが通常ジョブ→すっぴんのようなケースではジョブアビリティを消す操作
  for (;;) {
    var slots = this.skillEquipSlots();
    var skillEquips = this.skillEquips();
    var changed = false;
    for (var i = 0; i < skillEquips.length; i++) {
      var item = skillEquips[i];
      if (
        item &&
        (!this.canSkillEquip(item) || item.etypeId !== slots[i]) &&
        (this.currentClass().jobability === null || i != 0)
      ) {
        if (!forcing) {
          this.tradeItemWithParty(null, item);
        }
        this._SkillEquips[i].setObject(null);
        changed = true;
      }
    }
    if (!changed) {
      break;
    }
  }
};

Game_Actor.prototype.abrefresh = function () {
  var actor = this;
  this.skillEquips().forEach(function (ability) {
    if (ability && ability.counterType)
      actor._counterType = ability.counterType;
  }, this);
  this.releaseUnequippableAbs(false);
  this.refresh();
};

/*
Yanfly.SkillEquip.Game_Actor_isSkillEquipChangeOk = Game_Actor.prototype.isEquipChangeOk;
Game_Actor.prototype.isSkillEquipChangeOk = function(slotId) {
    if ($gameTemp._clearSkillEquipments) {
      var typeId = this.skillEquipSlots()[slotId];
      // if (Yanfly.Param.SkillEquipNonRemove.contains(typeId)) 
        return false;
    }
    if ($gameTemp._optimizeSkillEquipments) {
      var typeId = this.skillEquipSlots()[slotId];
      // if (Yanfly.Param.SkillEquipNonOptimized.contains(typeId)) 
        return false;
    }
    return Yanfly.SkillEquip.Game_Actor_isSkillEquipChangeOk.call(this, slotId);
};
*/

Game_Actor.prototype.paramBase = function (paramId) {
  if (paramId > 1) {
    var baseparam = this.currentClass().params[paramId][this._level];
    var skills = this.skillEquips();
    for (var i = 0; i < skills.length; ++i) {
      var item = skills[i];
      if (item && item.params[paramId] > baseparam) {
        baseparam = item.params[paramId];
      }
    }
    if (this.currentClass().id === 21 || this.currentClass().id === 22) {
      for (var i = 1; i < this._jobLevel.length; i++) {
        var job = $dataClasses[i];
        if (
          this._jobLevel[i] === 4 &&
          job.params[paramId][this._level] > baseparam
        ) {
          baseparam = job.params[paramId][this._level];
        }
      }
    }
    return baseparam;
  } else {
    var baseparam = this.currentClass().masterbonus[paramId];
    var skills = this.skillEquips();
    for (var i = 0; i < skills.length; ++i) {
      var item = skills[i];
      if (item && item.masterbonus[paramId] > baseparam) {
        baseparam = item.masterbonus[paramId];
      }
    }

    if (this.currentClass().id === 21 || this.currentClass().id === 22) {
      for (var i = 1; i < this._jobLevel.length; i++) {
        var job = $dataClasses[i];
        if (this._jobLevel[i] === 4 && job.masterbonus[paramId] > baseparam) {
          baseparam = job.masterbonus[paramId];
        }
      }
    }

    return (this.currentClass().params[paramId][this._level] * baseparam) / 100;
  }
};

Yanfly.SkillEquip.GaAc_traitObjects = Game_Actor.prototype.traitObjects;
Game_Actor.prototype.traitObjects = function () {
  var objects = Yanfly.SkillEquip.GaAc_traitObjects.call(this);
  var skills = this.skillEquips();
  for (var i = 0; i < skills.length; i++) {
    var item = skills[i];
    if (item) {
      objects.push(item);
    }
  }
  return objects;
};

//=============================================================================
// Window_SkillEquipCommand
//=============================================================================

function Window_SkillEquipCommand() {
  this.initialize.apply(this, arguments);
}

Window_SkillEquipCommand.prototype = Object.create(
  Window_HorzCommand.prototype
);
Window_SkillEquipCommand.prototype.constructor = Window_SkillEquipCommand;

Window_SkillEquipCommand.prototype.initialize = function (x, y, width) {
  this._windowWidth = width;
  Window_HorzCommand.prototype.initialize.call(this, x, y);
};

Window_SkillEquipCommand.prototype.windowWidth = function () {
  return 240;
};

Window_SkillEquipCommand.prototype.maxCols = function () {
  return 1;
};

Window_SkillEquipCommand.prototype.windowHeight = function () {
  return this.fittingHeight(this.numVisibleRows());
};

Window_SkillEquipCommand.prototype.numVisibleRows = function () {
  return 2;
};

Window_SkillEquipCommand.prototype.itemTextAlign = function () {
  return Yanfly.Param.SkillEquipTextAlign;
};

Window_SkillEquipCommand.prototype.makeCommandList = function () {
  this.addCommand(TextManager.equip2, "equip");
  this.addCustomCommand();
  this.addFinishCommand();
};

Window_SkillEquipCommand.prototype.addCustomCommand = function () {};

Window_SkillEquipCommand.prototype.addFinishCommand = function () {
  if (Yanfly.Param.SkillEquipFinishCmd === "") return;
  this.addCommand(Yanfly.Param.SkillEquipFinishCmd, "cancel");
};

//=============================================================================
// Window_SkillEquipSlot
//=============================================================================

function Window_SkillEquipSlot() {
  this.initialize.apply(this, arguments);
}

Window_SkillEquipSlot.prototype = Object.create(Window_Selectable.prototype);
Window_SkillEquipSlot.prototype.constructor = Window_SkillEquipSlot;

Window_SkillEquipSlot.prototype.initialize = function (x, y, width, height) {
  Window_Selectable.prototype.initialize.call(this, x, y, width, height);
  this._actor = null;
  this.refresh();
  this.activate();
  this.select(0);
};

Window_SkillEquipSlot.prototype.setActor = function (actor) {
  this.setSlotNameWidth(actor);
  if (this._actor !== actor) {
    this._actor = actor;
    this.refresh();
  }
};

Window_SkillEquipSlot.prototype.refresh = function () {
  if (this._actor) this._actor.refresh();
  Window_Selectable.prototype.refresh.call(this);
};

Window_SkillEquipSlot.prototype.isEnabled = function (index) {
  if (this._actor) {
    if (this._actor.currentClass().jobability != null && index == 0)
      return false;
    return (
      !this._actor.isEquipTypeLocked(this._actor.skillEquipSlots()[index]) &&
      !this._actor.isEquipTypeSealed(this._actor.skillEquipSlots()[index])
    );
  } else {
    return false;
  }
};

Window_SkillEquipSlot.prototype.isCurrentItemEnabled = function () {
  return this.isEnabled(this.index());
};

Window_SkillEquipSlot.prototype.drawItem = function (index) {
  if (!this._actor) return;
  var rect = this.itemRectForText(index);
  var item = this._actor.skillEquips()[index];
  if (item) {
    this.changePaintOpacity(this.isEnabled(index));
    this.drawText(item.name, rect.x, rect.y, rect.width);
  } else {
    this.changeTextColor(this.systemColor());
    this.changePaintOpacity(this.isEnabled(index));
    this.drawText(
      "<" + this.slotName(index) + ">",
      rect.x,
      rect.y,
      rect.width,
      "center"
    );
    this.resetTextColor();
  }
  this.changePaintOpacity(true);
};

Window_SkillEquipSlot.prototype.slotName = function (index) {
  var slots = this._actor.skillEquipSlots();
  return this._actor ? $dataSystem.equipTypes[slots[index]] : "";
};

Window_SkillEquipSlot.prototype.maxItems = function () {
  return this._actor ? this._actor.skillEquipSlots().length : 0;
};

Window_SkillEquipSlot.prototype.setSlotNameWidth = function (actor) {
  if (!actor) return;
  this._nameWidth = 0;
  for (var i = 0; i < actor.skillEquipSlots().length; ++i) {
    var text = $dataSystem.equipTypes[actor.skillEquipSlots()[i]] + " ";
    this._nameWidth = Math.max(this._nameWidth, this.textWidth(text));
  }
};

Window_SkillEquipSlot.prototype.setInfoWindow = function (infoWindow) {
  this._infoWindow = infoWindow;
  this.update();
};

Window_SkillEquipSlot.prototype.updateHelp = function () {
  Window_Selectable.prototype.updateHelp.call(this);
  this.setHelpWindowItem(this.item());
  if (this._statusWindow) {
    this._statusWindow.setTempActor(null);
  }
  if (SceneManager._scene instanceof Scene_SkillEquip && this._infoWindow) {
    this._infoWindow.setItem(this.item());
  }
};

Window_SkillEquipSlot.prototype.item = function () {
  return this._actor ? this._actor.skillEquips()[this.index()] : null;
};

//=============================================================================
// Window_SkillEquipItem
//=============================================================================

function Window_SkillEquipItem() {
  this.initialize.apply(this, arguments);
}

Window_SkillEquipItem.prototype = Object.create(Window_ItemList.prototype);
Window_SkillEquipItem.prototype.constructor = Window_SkillEquipItem;

Window_SkillEquipItem.prototype.needsNumber = function () {
  return false;
};

Window_SkillEquipItem.prototype.initialize = function (x, y, width, height) {
  Window_ItemList.prototype.initialize.call(this, x, y, width, height);
  this._actor = null;
  this._slotId = 0;
};

Window_SkillEquipItem.prototype.maxCols = function () {
  return 2;
};

Window_SkillEquipItem.prototype.setSlotId = function (slotId) {
  // do nothing
};

Window_SkillEquipItem.prototype.includes = function (item) {
  if (item === null) {
    return true;
  }
  if (
    this._slotId < 0 ||
    item.etypeId !== this._actor.skillEquipSlots()[this._slotId]
  ) {
    return false;
  }
  return this._actor.canSkillEquip(item);
};

Game_BattlerBase.prototype.canSkillEquip = function (item) {
  if (!item) {
    return false;
  } else if ($dataArmors.contains(item) && item.etypeId === 6) {
    return this.canEquipArmor(item);
  } else {
    return false;
  }
};

Window_SkillEquipItem.prototype.isEnabled = function (item) {
  return true;
};

Window_SkillEquipItem.prototype.drawItem = function (index) {
  var item = this._data[index];
  if (item) {
    var numberWidth = this.numberWidth();
    var rect = this.itemRect(index);
    rect.width -= this.textPadding();
    this.changePaintOpacity(this.isEnabled(item));
    this.drawItemName(item, rect.x, rect.y, rect.width);
    this.drawItemNumber(item, rect.x, rect.y, rect.width);
    this.changePaintOpacity(1);
  }
};

Window_SkillEquipItem.prototype.drawItemName = function (item, x, y, width) {
  width = width || 312;
  if (item) {
    var iconBoxWidth = Window_Base._iconWidth + 4;
    this.resetTextColor();
    // this.drawIcon(item.iconIndex, x + 2, y + 2);
    this.drawText(item.name, x, y, width);
  }
};

Window_SkillEquipItem.prototype.drawRemoveSkillEquip = function (index) {
  if (!this.isEnabled(null)) return;
  var rect = this.itemRect(index);
  rect.width -= this.textPadding();
  this.changePaintOpacity(true);
  var ibw = Window_Base._iconWidth + 4;
  this.resetTextColor();
  this.drawIcon(Yanfly.Icon.RemoveSkillEquip, rect.x + 2, rect.y + 2);
  var text = Yanfly.Param.SkillEquipRemoveText;
  this.drawText(text, rect.x + ibw, rect.y, rect.width - ibw);
};

Window_SkillEquipItem.prototype.setInfoWindow = function (infoWindow) {
  this._infoWindow = infoWindow;
  this.update();
};

Window_SkillEquipItem.prototype.updateHelp = function () {
  Window_ItemList.prototype.updateHelp.call(this);
  if (this._actor && this._statusWindow) {
    var actor = JsonEx.makeDeepCopy(this._actor);
    actor.forceChangeSkillEquip(this._slotId, this.item());
    this._statusWindow.setTempActor(actor);
  }
  if (SceneManager._scene instanceof Scene_SkillEquip && this._infoWindow) {
    this._infoWindow.setItem(this.item());
  }
};

//=============================================================================
// Scene_SkillEquip
//=============================================================================

function Scene_SkillEquip() {
  this.initialize.apply(this, arguments);
}

Scene_SkillEquip.prototype = Object.create(Scene_MenuBase.prototype);
Scene_SkillEquip.prototype.constructor = Scene_SkillEquip;

Scene_SkillEquip.prototype.initialize = function () {
  Scene_MenuBase.prototype.initialize.call(this);
};

Scene_SkillEquip.prototype.create = function () {
  Scene_MenuBase.prototype.create.call(this);
  this.createHelpWindow();
  // this.createCommandWindow();
  this.createStatusWindow();
  this.createSlotWindow();
  this.createItemWindow();
  this.createCompareWindow();
  this._lowerRightVisibility = true;
  this.updateLowerRightWindows();
  this.refreshActor();
};

Scene_SkillEquip.prototype.createCommandWindow = function () {
  this._commandWindow = new Window_SkillEquipCommand(0, 0, 240);
  this._commandWindow.setHelpWindow(this._helpWindow);
  this._commandWindow.setHandler("equip", this.commandEquip.bind(this));
  this._commandWindow.setHandler("cancel", this.popScene.bind(this));
  this._commandWindow.setHandler("pagedown", this.nextActor.bind(this));
  this._commandWindow.setHandler("pageup", this.previousActor.bind(this));
  this.addWindow(this._commandWindow);
};

Scene_SkillEquip.prototype.commandEquip = function () {
  this._commandWindow.activate();
  this._commandWindow.select(0);
};

Scene_SkillEquip.prototype.createStatusWindow = function () {
  var wx = 240;
  var wy = this._helpWindow.height;
  var ww = Graphics.boxWidth - wx;
  var wh = this._helpWindow.fittingHeight(4); // numofRows
  this._statusWindow = new Window_SkillStatus(wx, wy, ww, wh);
  this.addWindow(this._statusWindow);
};

Scene_SkillEquip.prototype.createSlotWindow = function () {
  var wy = this._helpWindow.height;
  var ww = 240;
  var wh = this._statusWindow.height;
  this._commandWindow = new Window_SkillEquipSlot(0, wy, ww, wh);
  this._commandWindow.setHelpWindow(this._helpWindow);
  this._commandWindow.setHandler("ok", this.onSlotOk.bind(this));
  this._commandWindow.setHandler("cancel", this.popScene.bind(this));
  this._commandWindow.setHandler("pagedown", this.nextActor.bind(this));
  this._commandWindow.setHandler("pageup", this.previousActor.bind(this));
  this.addWindow(this._commandWindow);
};

Scene_SkillEquip.prototype.createItemWindow = function () {
  var wy = this._helpWindow.height + this._commandWindow.height;
  var ww = (Graphics.boxWidth * 3) / 5;
  var wh = Graphics.boxHeight - wy;
  this._itemWindow = new Window_SkillEquipItem(0, wy, ww, wh);
  this._itemWindow.setHelpWindow(this._helpWindow);
  this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
  this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
  this._commandWindow.setItemWindow(this._itemWindow);
  this.addWindow(this._itemWindow);
};

Window_SkillEquipSlot.prototype.setItemWindow = function (itemWindow) {
  this._itemWindow = itemWindow;
  this.update();
};

Scene_SkillEquip.prototype.createCompareWindow = function () {
  this._lowerRightWindows = [];
  var wx = this._itemWindow.width;
  var wy = this._itemWindow.y;
  var ww = Graphics.boxWidth - wx;
  var wh = Graphics.boxHeight - wy;
  this._compareWindow = new Window_SkillStatCompare(wx, wy, ww, wh);
  this._commandWindow.setStatusWindow(this._compareWindow);
  this._itemWindow.setStatusWindow(this._compareWindow);
  this.addWindow(this._compareWindow);
  this._lowerRightWindows.push(this._compareWindow);
  if (Imported.YEP_ItemCore && eval(Yanfly.Param.ItemSceneItem)) {
    this.createItemInfoWindow();
  }
};

Window_SkillEquipSlot.prototype.setStatusWindow = function (statusWindow) {
  this._statusWindow = statusWindow;
  this.callUpdateHelp();
};

Window_SkillEquipItem.prototype.setStatusWindow = function (statusWindow) {
  this._statusWindow = statusWindow;
  this.callUpdateHelp();
};

Scene_SkillEquip.prototype.createItemInfoWindow = function () {
  var wx = this._itemWindow.width;
  var wy = this._itemWindow.y;
  var ww = Graphics.boxWidth - wx;
  var wh = this._itemWindow.height;
  this._infoWindow = new Window_ItemInfo(wx, wy, ww, wh);
  this._commandWindow.setInfoWindow(this._infoWindow);
  this._itemWindow.setInfoWindow(this._infoWindow);
  this.addWindow(this._infoWindow);
  this._lowerRightWindows.push(this._infoWindow);
};

Scene_SkillEquip.prototype.refreshActor = function () {
  var actor = this.actor();
  this._statusWindow.setActor(actor);
  this._commandWindow.setActor(actor);
  this._itemWindow.setActor(actor);
  this._compareWindow.setActor(this.actor());
};

Window_SkillEquipItem.prototype.setActor = function (actor) {
  if (this._actor !== actor) {
    this._actor = actor;
    this.refresh();
    this.resetScroll();
  }
};

Scene_SkillEquip.prototype.onSlotOk = function () {
  this._itemWindow._slotId = -1;
  var slotId = this._commandWindow.index();
  if (this._itemWindow._slotId !== slotId) {
    this._itemWindow._slotId = slotId;
    this._itemWindow.refresh();
    this._itemWindow.resetScroll();
  }
  this._itemWindow.activate();
  this._itemWindow.select(0);
};

Scene_SkillEquip.prototype.onSlotCancel = function () {
  this._commandWindow.deselect();
  this._commandWindow.activate();
  if (this._infoWindow) this._infoWindow.setItem(null);
  this._compareWindow.setTempActor(null);
};

Scene_SkillEquip.prototype.onItemOk = function () {
  var hpRate = this.actor().hp / Math.max(1, this.actor().mhp);
  var mpRate = this.actor().mp / Math.max(1, this.actor().mmp);

  SoundManager.playEquip();
  this.actor().changeSkillEquip(
    this._commandWindow.index(),
    this._itemWindow.item()
  );
  this._commandWindow.activate();
  this._commandWindow.refresh();
  this._itemWindow.deselect();
  this._itemWindow.refresh();
  this._statusWindow.refresh();

  var max = this.actor().isDead() ? 0 : 1;
  var hpAmount = Math.max(max, parseInt(this.actor().mhp * hpRate));
  this.actor().setHp(hpAmount);
  this.actor().setMp(parseInt(this.actor().mmp * mpRate));
  this._commandWindow.show();
  this._statusWindow.refresh();
};

Scene_SkillEquip.prototype.onItemCancel = function () {
  this._commandWindow.activate();
  this._itemWindow.deselect();
  this._compareWindow.setTempActor(null);
  this._commandWindow.show();
};

Scene_SkillEquip.prototype.update = function () {
  Scene_MenuBase.prototype.update.call(this);
  if (this.isActive()) this.updateLowerRightWindowTriggers();
};

Scene_SkillEquip.prototype.updateLowerRightWindowTriggers = function () {
  if (!this._lowerRightVisibility) return;
  if (Input.isRepeated("right")) {
    this.shiftLowerRightWindows();
  } else if (Input.isRepeated("left")) {
    this.unshiftLowerRightWindows();
  } else if (Input.isRepeated("tab")) {
    this.shiftLowerRightWindows();
  } else if (this.isLowerWindowTouched()) {
    this.shiftLowerRightWindows();
  }
};

Scene_SkillEquip.prototype.isLowerWindowTouched = function () {
  if (!TouchInput.isTriggered()) return false;
  var x = TouchInput.x;
  var y = TouchInput.y;
  var rect = new Rectangle();
  rect.x = this._compareWindow.x;
  rect.y = this._compareWindow.y;
  rect.width = this._compareWindow.x + this._compareWindow.width;
  rect.height = this._compareWindow.y + this._compareWindow.height;
  return x >= rect.x && y >= rect.y && x < rect.width && y < rect.height;
};

Scene_SkillEquip.prototype.updateLowerRightWindows = function () {
  var length = this._lowerRightWindows.length;
  for (var i = 0; i < length; ++i) {
    var win = this._lowerRightWindows[i];
    win.visible = false;
  }
  this._lowerRightWindows[0].visible = this._lowerRightVisibility;
};

Scene_SkillEquip.prototype.shiftLowerRightWindows = function () {
  var win = this._lowerRightWindows.shift();
  this._lowerRightWindows.push(win);
  this.updateLowerRightWindows();
  this.playLowerRightWindowSound();
};

Scene_SkillEquip.prototype.unshiftLowerRightWindows = function () {
  var win = this._lowerRightWindows.pop();
  this._lowerRightWindows.unshift(win);
  this.updateLowerRightWindows();
  this.playLowerRightWindowSound();
};

Scene_SkillEquip.prototype.playLowerRightWindowSound = function () {
  if (this._lowerRightWindows.length <= 1) return;
  SoundManager.playCursor();
};

Scene_SkillEquip.prototype.onActorChange = function () {
  this.refreshActor();
  this._commandWindow.activate();
  this._compareWindow.setTempActor(null);
  if (this._infoWindow) this._infoWindow.setItem(null);
};

//=============================================================================
// Window_SkillStatCompare
//=============================================================================

function Window_SkillStatCompare() {
  this.initialize.apply(this, arguments);
}

Window_SkillStatCompare.prototype = Object.create(Window_StatCompare.prototype);
Window_SkillStatCompare.prototype.constructor = Window_SkillStatCompare;

Window_StatCompare.prototype.createWidths = function () {
  this._paramNameWidth = this.textWidth("あああ");
  this._paramValueWidth = 0;
  this._arrowWidth = this.textWidth("\u2192" + " ");
  var buffer = this.textWidth(" ");
  for (var i = 0; i < 8; ++i) {
    var value2 = this.textWidth(Yanfly.Util.toGroup(this._actor.paramMax(i)));
    this._paramValueWidth = Math.max(value2, this._paramValueWidth);
  }
  this._bonusValueWidth = 0;
  this._paramNameWidth += buffer;
};

Window_SkillStatCompare.prototype.refresh = function () {
  this.contents.clear();
  if (!this._actor) return;
  var statorder = [0, 1, 7, 4, 6];
  var step = 0;
  for (var i = 0; i < statorder.length; ++i) {
    if (i == 2) step += 10;
    this.drawItem(0, this.lineHeight() * i + step, statorder[i]);
  }
};

Window_SkillStatCompare.prototype.drawParamName = function (y, paramId) {
  var x = this.textPadding();
  this.changeTextColor(this.systemColor());
  this.drawText(TextManager.param(paramId), x, y, this._paramNameWidth);
};

Window_SkillStatCompare.prototype.drawCurrentParam = function (y, paramId) {
  var x = this.contents.width - this.textPadding();
  x -= this._paramValueWidth + this._arrowWidth + this._bonusValueWidth + 80;
  this.resetTextColor();
  var actorparam = Yanfly.Util.toGroup(this._actor.param(paramId));
  this.drawText(actorparam, x, y, this._paramValueWidth, "right");
};

Window_SkillStatCompare.prototype.drawRightArrow = function (y, paramId) {
  var x = this.contents.width - this.textPadding();
  x -= this._arrowWidth + this._bonusValueWidth + 75;
  var dw = this.textWidth("\u2192" + " ");
  this.changeTextColor(this.systemColor());
  this.drawText("\u2192", x, y, dw, "right");
};

Window_SkillStatCompare.prototype.drawNewParam = function (y, paramId) {
  var x = this.contents.width - this.textPadding();
  x -= this._bonusValueWidth + 60;
  var newValue = this._tempActor.param(paramId);
  var diffvalue = newValue - this._actor.param(paramId);
  var actorparam = Yanfly.Util.toGroup(newValue);
  this.changeTextColor(this.paramchangeTextColor(diffvalue));
  this.drawText(actorparam, x, y, this._paramValueWidth, "right");
};

//=============================================================================
// Utilities
//=============================================================================

Yanfly.Util = Yanfly.Util || {};

if (!Yanfly.Util.toGroup) {
  Yanfly.Util.toGroup = function (inVal) {
    return inVal;
  };
}

Yanfly.Util.displayError = function (e, code, message) {
  console.log(message);
  console.log(code || "NON-EXISTENT");
  console.error(e);
  if (Utils.RPGMAKER_VERSION && Utils.RPGMAKER_VERSION >= "1.6.0") return;
  if (Utils.isNwjs() && Utils.isOptionValid("test")) {
    if (!require("nw.gui").Window.get().isDevToolsOpen()) {
      require("nw.gui").Window.get().showDevTools();
    }
  }
};

//=============================================================================
// End of File
//=============================================================================
