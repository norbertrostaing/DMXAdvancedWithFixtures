/// DMX processing

/*
to do list : 
- add fixture types ?
- clear patch : use string with coma to multiple patch
	-> allow to have only one big list with channel name => patch values
*/


var clearAllSlotsBtn = script.addTrigger("Clear all slots", "Clear all slots for all channels");

var slotsValues = {};
var slotsLevels = {};

function verifSlotData(chanName) {
	if (!slotsValues[chanName]) {
		// script.log(chanName);
		slotsValues[chanName] = {"HTP" : {}, "LTP" : {}, "LTPStack" : [], "FX" : {}, "dataType" : ""};
	}
}

var dmxSlot = function() {
	this.value = 0;
	this.name = "";
};

function setValueSimple(fixtNames, paramName, dataType, mode, slotName, value) {
	if (fixtNames == "") {return false;}
	if (paramName == "") {return false;}
	if (dataType == "i8") {setValue(fixtNames, paramName,dataType, mode, slotName, value, false, false, false); }
	else if (dataType == "i16") {setValue(fixtNames, paramName,dataType, mode, slotName, false, value, false, false); }
	else if (dataType == "rgb8") {setValue(fixtNames, paramName,dataType, mode, slotName, false, false, value, false); }
	else if (dataType == "rgb16") {setValue(fixtNames, paramName,dataType, mode, slotName, false, false, false, value); }
}

function setSlotLevel(slotName, value) {
	slotsLevels[slotName] = value;
}

function refreshSlot(chanName) {
	if (chanName == "") {return false;}
	if (slotsValues[chanName].dataType == "i8") {processChannelI8(chanName);}
	else if (slotsValues[chanName].dataType == "i16") {processChannelI16(chanName);}
	else if (slotsValues[chanName].dataType == "rgb8") {processChannelRGB8(chanName);}
	else if (slotsValues[chanName].dataType == "rgb16") {processChannelRGB16(chanName);}

}

function setLTPValue(fixtNames, paramName, dataType, slotName, valuei8, valuei16, valuergb8, valuergb16) {
	if (paramName == "") {return false;}
	setValue(fixtNames, paramName, dataType, "LTP", slotName, valuei8, valuei16, valuergb8, valuergb16);	
}

function setHTPValue(fixtNames, paramName, dataType, slotName, valuei8, valuei16, valuergb8, valuergb16) {
	if (paramName == "") {return false;}
	setValue(fixtNames, paramName, dataType, "HTP", slotName, valuei8, valuei16, valuergb8, valuergb16);	
}

function setFXValue(fixtNames, paramName, dataType, slotName, valuei8, valuei16, valuergb8, valuergb16) {
	if (paramName == "") {return false;}
	setValue(fixtNames, paramName, dataType, "FX", slotName, valuei8, valuei16, valuergb8, valuergb16);	
}

function setValue(fixtNames, paramName, dataType, mode, slotName, valuei8, valuei16, valuergb8, valuergb16) {
	if (fixtNames == "") {return false;}
	if (paramName == "") {return false;}

	var fixtures = fixtNames.split(",");
	for (var i = 0; i< fixtures.length; i++) {
		var fName = fixtures[i].trim();
		var chanName = fName+"/"+paramName;

		if (dataType == "i8") {setChannel8bit(chanName, mode, slotName, valuei8); }
		else if (dataType == "i16") {setChannel16bit(chanName, mode, slotName, valuei16); }
		else if (dataType == "rgb8") {setChannelRGB8bit(chanName, mode, slotName, valuergb8); }
		else if (dataType == "rgb16") {setChannelRGB16bit(chanName, mode, slotName, valuergb16); }
	}
}

function setChannel8bit(chanName, mode, slotName, value) {
	updateSlot(chanName, mode, slotName, value, "i8");
	processChannelI8(chanName);
}

function setChannel16bit(chanName, mode, slotName, value) {
	updateSlot(chanName, mode, slotName, value, "i16");
	processChannelI16(chanName);
}

function setChannelRGB8bit(chanName, mode, slotName, value) {
	updateSlot(chanName, mode, slotName, value, "rgb8");
	processChannelRGB8(chanName);
}

function setChannelRGB16bit(chanName, mode, slotName, value) {
	updateSlot(chanName, mode, slotName, value, "rgb16");
	processChannelRGB16(chanName);
}

function clearSlot(slotName) {
	var channelNames = util.getObjectProperties(slotsValues);
	for (var i = 0; i < channelNames.length; i++) {
		var chanName = channelNames[i];
		var slot = slotsValues[chanName].LTP[slotName];
		if (slot !== undefined) {
			var index = slotsValues[chanName].LTPStack.indexOf(slot);
			if (index != -1) {slotsValues[chanName].LTPStack.splice(index,1);}
			slotsValues[chanName][mode][slotName] = undefined;
		}
		slotsValues[chanName].HTP[slotName] = undefined;
		slotsValues[chanName].FX[slotName] = undefined;

		if (slotsValues[chanName].dataType == "i8") {processChannelI8(chanName);}
		else if (slotsValues[chanName].dataType == "i16") {processChannelI16(chanName);}
		else if (slotsValues[chanName].dataType == "rgb8") {processChannelRGB8(chanName);}
		else if (slotsValues[chanName].dataType == "rgb16") {processChannelRGB16(chanName);}
	}
}


function clearChannel(chanName, mode) {
	if (mode == "LTP" || mode == "All") {
		slotsValues[chanName].LTP = {};
		slotsValues[chanName].LTPStack = {};
	}
	if (mode == "HTP" || mode == "All") {
		slotsValues[chanName].HTP = {};
	}
	if (mode == "FX" || mode == "All") {
		slotsValues[chanName].FX = {};
	}
}

function clearAllChannel(mode) {
	for (var i = 0; i < 512; i++) {
		clearChannel(i+1, mode);
	}
}


function updateSlot(chanName, mode, slotName, value, dataType) {
	if (chanName == "") {return false;}
	verifSlotData(chanName);
	slotsValues[chanName].dataType = dataType;
	if (mode == "HTP") {setHTPChannel(chanName, slotName, value);}
	else if (mode == "LTP") {setLTPChannel(chanName, slotName, value) ;}
	else if (mode == "FX") {setFXChannel(chanName, slotName, value) ;}
}

function setHTPChannel(chanName, slotName, value) {
	if (!slotsValues[chanName].HTP[slotName]) {slotsValues[chanName].HTP[slotName] = new dmxSlot(); }
	slotsValues[chanName].HTP[slotName].value = value;
	slotsValues[chanName].HTP[slotName].name = slotName;
}

function setLTPChannel(chanName, slotName, value) {
	if (!slotsValues[chanName].LTP[slotName]) {
		slotsValues[chanName].LTP[slotName] = new dmxSlot();
	}
	var slot = slotsValues[chanName].LTP[slotName];
	slot.value = value;
	slot.name = slotName;
	var index = slotsValues[chanName].LTPStack.indexOf(slot);
	if (index != -1) {slotsValues[chanName].LTPStack.splice(index,1);}
	slotsValues[chanName].LTPStack.push(slot);
}

function setFXChannel(chanName, slotName, value) {
	if (!slotsValues[chanName].FX[slotName]) {
		slotsValues[chanName].FX[slotName] = new dmxSlot();
	}
	slotsValues[chanName].FX[slotName].value = value;
	slotsValues[chanName].FX[slotName].name = slotName;
}

function processChannelI8(chanName) {
	var val = processNumericChannel(chanName);
	write8bitValue(chanName, val);
}

function processChannelI16(chanName) {
	var val = processNumericChannel(chanName);
	write16bitValue(chanName, val);
}

function processChannelRGB8(chanName) {
	var val = processRGBChannel(chanName);
	write8bitRGB(chanName, val);
}

function processChannelRGB16(chanName) {
	var val = processRGBChannel(chanName);
	write16bitRGB(chanName, val);
}

function getSlotLevel(name) {
	var level = slotsLevels[name] !== undefined ? slotsLevels[name] : 1;
	return level;
} 

function processNumericChannel(chanName) {
	var val = 0;
	var data = slotsValues[chanName];
	if (data.LTPStack.length > 0 ) {
		for (var i = 0; i < data.LTPStack.length; i++) {
			var s = data.LTPStack[i];
			var level = getSlotLevel(s.name);
			val = map(level, 0, 1, val, s.value);
		}
	}
	if (data.HTP) {
		var slotsId = util.getObjectProperties(data.HTP);
		for (var i = 0; i< slotsId.length; i++) {
			var s = data.HTP[slotsId[i]];
			var level = getSlotLevel(s.name);
			val = Math.max(val, s.value * level);
		}
	}
	if (data.FX) {
		var slotsId = util.getObjectProperties(data.FX);
		for (var i = 0; i< slotsId.length; i++) {
			var s = data.FX[slotsId[i]];
			var level = getSlotLevel(s.name);
			val += s.value * level;
		}
	}
	val = Math.max(val, 0);
	val = Math.min(val, 1);
	return val;
}

function processRGBChannel(chanName) {
	var val = [0,0,0,0];
	var data = slotsValues[chanName];
	if (data.LTPStack) {
		for (var i = 0; i < data.LTPStack.length; i++) {
			var slotName = data.LTPStack[i].name;
			var s = data.LTP[slotName];
			var level = getSlotLevel(s.name);
			for (var j = 0; j < 4; j++) {
				val[j] = map(level,0,1,val[j], s.value[j]);
			}
		}
	}

	if (data.HTP) {
		var slotsId = util.getObjectProperties(data.HTP);
		for (var i = 0; i< slotsId.length; i++) {
			var s = data.HTP[slotsId[i]];
			var level = getSlotLevel(s.name);
			for (var j = 0; j < 4; j++) {
				val = Math.max(val[j], s.value[j] * level);
			}
		}
	}

	if (data.FX) {
		var slotsId = util.getObjectProperties(data.FX);
		for (var i = 0; i< slotsId.length; i++) {
			var s = data.FX[slotsId[i]];
			var level = getSlotLevel(s.name);
			for (var j = 0; j < 4; j++) {
				val[j] += s.value[j] * level;
			}
		}
	}

	return val;
}

function write8bitValue(chanName, value) {
	value = Math.round(value*255);
	var chans = getPatch(chanName);
	for (var i = 0; i< chans.length; i++) {
		var address = chans[i];
		local.send(address, value);
	}
}

function write16bitValue(chanName, value) {
	value = value * ((256 * 256)-1);
	var msb = Math.floor(value / 256);
	var lsb = Math.floor(value % 256);
	var chans = getPatch(chanName);
	for (var i = 0; i< chans.length; i++) {
		var address = chans[i];
		local.send(address, msb);
		local.send(address+1, lsb);
	}
}

function write8bitRGB(chanName, value) {
	var r = Math.round(value[0]*255);
	var g = Math.round(value[1]*255);
	var b = Math.round(value[2]*255);
	var chans = getPatch(chanName);
	for (var i = 0; i< chans.length; i++) {
		var address = chans[i];
		local.send(address+0, r);
		local.send(address+1, g);
		local.send(address+2, b);
	}
}

function write16bitRGB(chanName, value) {
	var r = value[0] * ((256 * 256)-1);
	var g = value[1] * ((256 * 256)-1);
	var b = value[2] * ((256 * 256)-1);
	var chans = getPatch(chanName);
	for (var i = 0; i< chans.length; i++) {
		var address = chans[i];
		local.send(address+0, Math.floor(r/256));
		local.send(address+1, Math.floor(r%256));
		local.send(address+2, Math.floor(g/256));
		local.send(address+3, Math.floor(g%256));
		local.send(address+4, Math.floor(b/256));
		local.send(address+5, Math.floor(b%256));
	}
}


////////  Patch helper

var variablesGroup = script.addTargetParameter("Patch helper variables","Select the custom variable group that you wanna use as values");
variablesGroup.setAttribute("targetType","container");
variablesGroup.setAttribute("root",root.customVariables);
variablesGroup.setAttribute("searchLevel",0);

var inputList = script.addTargetParameter("Patch helper custom variables list","Select the multiplex list that you wanna fill");
inputList.setAttribute("targetType","container");
inputList.setAttribute("root",root.states);
inputList.setAttribute("searchLevel",4);

var dmxChannelsList = script.addTargetParameter("Patch helper channels list","Select the multiplex list that you wanna fill");
dmxChannelsList.setAttribute("targetType","container");
dmxChannelsList.setAttribute("root",root.states);
dmxChannelsList.setAttribute("searchLevel",4);

var fillInputListBtn = script.addTrigger("Fill input list", "Fill selected list with selected custom variables");

function fillInputList() {
	var group = variablesGroup.getTarget();
	var cvlist = inputList.getTarget();
	var dmxlist = dmxChannelsList.getTarget();
	if (!group.variables || !cvlist) {return;}

	var variables = group.variables.getItems();
	var cvInputs = getInputListElements(cvlist);

	var dmxIinputs = getInputListElements(dmxlist);

	var max = Math.min(variables.length, cvInputs.length);
	for (var i = 0; i < max; i++) {
		cvInputs[i].set(variables[i].getChild(variables[i].name));
		dmxIinputs[i].set(variables[i].niceName);
	}
}

function scriptParameterChanged(param) {
	if(param.is(fillInputListBtn)) {
		fillInputList();
	} else if(param.is(clearAllSlotsBtn)) {
		clearAllChannel();
	}  
}


function getInputListElements(element) {
	var children = [];
	var props = util.getObjectProperties(element);
	for (var i = 0; i< props.length; i++) {
		if (element[props[i]]._type == "Controllable" && props[i].substring(0,1) == "#") {
			children.push(element[props[i]]);
		}
	}
	return children;
}


function effect(fixtNames, paramName, dataType, mode, slotName, sequenceValue, blocs, wings, groups) {
	var target = controlAdressToElement(sequenceValue);
	if (! target) { return; }
	var parent = getLayerAndSequence(target);
	if (!parent) {return; }

	var totalTime = parent.sequence.totalTime.get();
	var currentTime = parent.sequence.currentTime.get();
	
	fixtNames = fixtNames.split(",");
	var total = fixtNames.length;
	var totalGroup = Math.ceil(total / groups);
	var totalWing = Math.ceil(totalGroup / wings);

	for (var i = 0; i< fixtNames.length; i++) {
		var chanName = fixtNames[i].trim()+"/"+paramName;
		var index = i - ( i % blocs);
		index = index % totalGroup;
		var wingNumber = Math.floor((index/totalGroup) * wings);
		index = index % totalWing;
		if (wingNumber % 2 == 1) {index = totalWing - 1 - index;}
	
		var time = currentTime + (2*totalTime) - ((index / totalWing) * totalTime);
		while(time > totalTime) {time -= totalTime;}
		
		var val;
		if (parent.layer.automation) {
			val = parent.layer.automation.getValueAtPosition(time);
		} else if (parent.layer.colors) {
			val = parent.layer.colors.getColorAtPosition(time);
		} else {
			// explode(parent.layer);
		}

		setValueSimple(fixtNames[i], paramName, dataType, mode, slotName, val);

	}

	// arrondir ?
}


function effectOne(chanName, dataType, mode, slotName, sequenceValue, num, total) {
	var target = controlAdressToElement(sequenceValue);
	if (! target) { return; }
	var parents = getLayerAndSequence(target);
	if (!parents) {return; }

	var totalTime = parents.sequence.totalTime.get();
	var currentTime = parents.sequence.currentTime.get();
	
	var time = currentTime + (2*totalTime) - ((num / total) * totalTime);
	while(time > totalTime) {time -= totalTime;}
	
	var val = parents.layer.automation.getValueAtPosition(time);
	setValueSimple(chanName, dataType, mode, slotName, val);
}

function effectCV(targetValue, targetCV, num, total) {
	targetCV = controlAdressToElement(targetCV);
	if (!targetCV) {return;}
	var target = controlAdressToElement(targetValue);
	if (! target) { return; }
	var parents = getLayerAndSequence(target);
	if (!parents) {return; }

	var totalTime = root.sequences.effect.totalTime.get();
	var currentTime = root.sequences.effect.currentTime.get();
	
	var time = currentTime + (2*totalTime) - ((num / total) * totalTime);
	while(time > totalTime) {time -= totalTime;}
	
	var val = parents.layer.automation.getValueAtPosition(time);
	targetCV.set(val);

}

function controlAdressToElement(a) {
	if (!a) {return false;}
	script.log(a);
	a = a+"";
	if (a == "") {return false;}
	a = a.split("/");
	if (!a) {return false;}
	a.splice(0,1);
	target = root;
	while (a.length > 0 && target != undefined) {
		target = target.getChild(a[0]);
		a.splice(0,1);
	}
	return target;
} 

function getLayerAndSequence(t) {
	var layer = false;
	var sequence = false;
	var noParent = false;
	// explode(t.getParent());
	while ((!layer || !sequence) && !noParent) {
		if (!t.is(root)) {
			t = t.getParent();
			if (t.layerColor != undefined) {layer = t;}
			if (t.currentTime != undefined) {sequence = t;}
		} else {
			noParent = true;
		}
	}
	if (noParent) {
		return false;
	}
	return {
		"layer":layer, 
		"sequence":sequence, 
	};
}



var patch = {};

var fixturesTypesContainer = local.parameters.addContainer("Fixture Types");
var addFixtureTypeBtn = fixturesTypesContainer.addTrigger("Add Fixture Type", "Create a new fixture type");

var fixturesContainer = local.parameters.addContainer("Fixtures");
var addFixtureList = fixturesContainer.addEnumParameter("New fixtures Type", "Type of the fixture to add");
var addFixtureCount = fixturesContainer.addIntParameter("New fixtures count", "Number of fixtures to add", 1, 1);
var addFixtureName = fixturesContainer.addStringParameter("New fixtures name", "Name to apply to new fixtures", "");
var addFixtureBtn = fixturesContainer.addTrigger("Add Fixture", "Add new fixture(s)");

var fixtureTypesData = {};
var fixturesData = {};

var deleteFixturesItems = [];
var deletePatchItems = [];

var commandsContainer = local.parameters.addContainer("Tools");

var CVSeqContainer = commandsContainer.addContainer("Fixtures Custom Variables Mapping");
var mappingNameInput = CVSeqContainer.addStringParameter("Mapping name", "Name used for CV group and mapping names", "Sequence");
var mappingChannelFilter = CVSeqContainer.addStringParameter("Parameter filters", "Paramters to map, separated by coma, leave blank for all", "");
var CVmappingType = CVSeqContainer.addEnumParameter("Mapping type", "is it LTP or HTP by default ?", "LTP", "LTP", "HTP", "HTP");
var CVSeqGoBtn = CVSeqContainer.addTrigger("Create CV Mapping", "Create Custom variable group and mappings");

var FXContainer = commandsContainer.addContainer("Effect helper");
var FXSlotName = FXContainer.addStringParameter("SlotName", "Name of the slot to write one","FX");
var FXFixtName = FXContainer.addStringParameter("Fixture name starts", "Auto add all fixtures with name beginning by the value", "");
var FXSequence = FXContainer.addTargetParameter("Sequence", "Sequence value to use as effect");
FXSequence.setAttribute("root",root.sequences);
FXSequence.setAttribute("searchLevel",3);
var FXAddBtn = FXContainer.addTrigger("Create FX", "Go for FX creation");



function update(deltaTime) {
	for (var i = 0; i< deletePatchItems.length; i++) {
		patchContainer.removeContainer(deletePatchItems[i].name);
		patch[deletePatchItems[i].niceName] = false;
	}		
	deletePatchItems = [];

	for (var i = 0; i< deleteFixtureItems.length; i++) {
		deleteFixtureItems[i].getParent().removeContainer(deleteFixtureItems[i].name);
	}		
	deleteFixtureItems = [];

}

function getPatch(chanName) {
	//script.log("patch");
	if (patch[chanName] == undefined) {
		script.log("no patch for "+chanName);
		return [];
	} else {
		// script.log(patch[chanName].length);
		return patch[chanName];
	}
}

function init() {
	updateData();
	verifButtons();
}

function moduleParameterChanged(param) {
	var parent = param.getParent();
	if (param.is(addFixtureBtn)) {
		addFixture();
		updateData();
	} else if (param.is(FXAddBtn)) {
		createFX();
	} else if (param.is(CVSeqGoBtn)) {
		createCVMapping();
	} else if (param.is(addFixtureTypeBtn)) {
		addFixtureType();
		updateData();
	} else if (param.name == "addParameter") {
		addChannel(parent);
		updateData();
	} else if (param.name == "removeParameter") {
		deleteFixtureItems.push(parent);
	} else if (param.name == "deleteFixtureType") {
		deleteFixtureItems.push(parent);
	} else if (param.name == "deleteFixture") {
		deleteFixtureItems.push(parent);
	} else if (param.name == "fixtureName") {
		parent.setName(param.get());
		updateData();
	} else if (param.name == "fixtureTypeName") {
		parent.setName(param.get());
		updateData();
	} else if (param.name == "parameterName") {
		updateData();
	} else if (param.name == "parameterType") {
		updateData();
	} else if (param.name == "fixturePatch") {
		updateData();
	} else if (param.name == "addPatch" || param.name == "deletePatch") {
		var next = 0;
		var valid = true;
		while (valid) {
			next++;
			valid = parent["address"+next] !== undefined;
		}
		if (param.name == "addPatch") {
			var addressField = parent.addIntParameter("Address "+(next), "DMX Address (set to 0 means disabled)", 0, 0, 512);
			addressField.setAttribute("saveValueOnly",false);
		} else if (param.name == "deletePatch") {
			if (next > 2) {
				parent.removeParameter("address"+(next-1));
			} else {
				deletePatchItems.push(parent);
			}
		} 
	} else if (param.name.substring(0,7) == "address") {
		readPatchFromInput(param.getParent().name, param.getParent().niceName);
	} else {
		script.log("param not valid : " + param.name);
	}
}
















function addFixtureType() {
	var container = fixturesTypesContainer.addContainer("New fixture type");
	var n = container.addStringParameter("Fixture type name", "Name of this fixture type", "");
	n.setAttribute("saveValueOnly",false);
	container.addTrigger("Delete fixture type", "Delete this fixture type");
	container.addTrigger("Add Parameter", "Create a new parameter for this fixture");
}

function addChannel(parent) {
	var n = 1;
	while (parent.getChild("Parameter "+n)) {n++;}
	var chan = parent.addContainer("Parameter "+n);
	chan.addTrigger("Remove Parameter", "Remove this parameter");
	chan.addStringParameter("Parameter Name", "Name of the parameter", "").setAttribute("saveValueOnly",false);
	chan.addEnumParameter("Parameter Type", "Type of data for this channel",
		" ", "notSet", 
		"8bit", "i8", 
		"16bit", "i16",
		"8bit Color", "rgb8", 
		"16bit Color", "rgb16"
		 ).setAttribute("saveValueOnly",false);
}

function removeChannel(parent) {
	deleteFixtureItems.push(parent);
}

function addFixture() {

	var type = addFixtureList.getKey();
	var number = addFixtureCount.get();
	var name = addFixtureName.get();

	var types = util.getObjectProperties(fixtureTypesData);
	script.log("type : " + type);

	for (var i = 0; i< number; i++) {
		var fixtName = name+" "+(i+1);
		var fixtContainer = fixturesContainer.addContainer(fixtName);
		var n = fixtContainer.addStringParameter("Fixture name", "Name of this fixture", "");
		n.setAttribute("saveValueOnly",false);
		var f = fixtContainer.addEnumParameter("Fixture Type", "Type of the fixture");
		for (var j = 0; j< types.length; j++) {
			f.addOption(types[j], types[j]);
		}
		f.set(type);
		f.setAttribute("saveValueOnly",false);
		var p = fixtContainer.addStringParameter("Fixture Patch", "Adresses of fixtures, separated by coma", "").setAttribute("saveValueOnly",false);

		n.set(fixtName);
		fixtContainer.addTrigger("Delete fixture", "Delete this fixture");
	}

}






function updateData() {
	updateFixtureLibData();
	updateFixtureTypesEnums();
	updatePatchData();
}

function updateFixtureLibData() {
	reloadObjects();
	var c = util.getObjectProperties(fixturesTypesContainer);
	var newData = {};
	for (var iFixt = 0; iFixt < c.length; iFixt++ ) {
		if (fixturesTypesContainer[c[iFixt]]._type == "Container") {
			var fContainer = fixturesTypesContainer[c[iFixt]];
			var fName = fixturesTypesContainer[c[iFixt]].getChild("fixtureTypeName").get();
			newData[fName] = {};
			var chans = util.getObjectProperties(fContainer);
			var dmxOffset = 0;
			for (var iChans = 0; iChans < chans.length; iChans++ ) {
				if (fContainer[chans[iChans]]._type == "Container") {
					var cName = fContainer[chans[iChans]].getChild("parameterName").get();
					var cType = fContainer[chans[iChans]].getChild("parameterType").get();

					newData[fName][cName] = {
						"name" : cName,
						"type" : cType,
						"channelOffset" : dmxOffset
					};
					if (cType == "i8") {dmxOffset += 1;}
					if (cType == "i16") {dmxOffset += 2;}
					if (cType == "rgb8") {dmxOffset += 3;}
					if (cType == "rgb16") {dmxOffset += 6;}
				}
			}

		}
	}
	fixtureTypesData = newData;
}


function updateFixtureTypesEnums() {
	reloadObjects();
	var types = util.getObjectProperties(fixtureTypesData);
	addFixtureList.removeOptions();
	addFixtureList.addOption("  ", "");
	for (var j = 0; j< types.length; j++) {
		script.log("coucou");
		addFixtureList.addOption(types[j], types[j]);
	}

	var fixtures = getChildrenContainers(fixturesContainer);
	for (var i = 0; i< fixtures.length; i++) {
		var enum = fixtures[i].getChild("fixtureType");
		var value = enum.getKey();
		enum.removeOptions();
		var keyIsValid = false;
		enum.addOption("  ", "");
		for (var j = 0; j< types.length; j++) {
			enum.addOption(types[j], types[j]);
			keyIsValid = keyIsValid || value == types[j];
		}
		if (keyIsValid) {
			enum.set(value);
		}
	}
}

function updatePatchData() {
	reloadObjects();
	var newPatch = {};
	var newFixturesData = {};
	var fixtures = getChildrenContainers(fixturesContainer);
	for (var i = 0; i< fixtures.length; i++) {
		var fixtName = fixtures[i].getChild("fixtureName").get().trim();
		var fixtType = fixtures[i].getChild("fixtureType").get();
		var fixtPatch = fixtures[i].getChild("fixturePatch").get().split(",");
		var channels = util.getObjectProperties(fixtureTypesData[fixtType]);
		newFixturesData[fixtName] = {"channels" : []};	
		for (var j = 0; j< channels.length; j++) {
			var chanName = fixtName+"/"+channels[j];
			newPatch[chanName] = [];
			var data = fixtureTypesData[fixtType][channels[j]];
			newFixturesData[fixtName].channels.push(fixtureTypesData[fixtType][channels[j]]);
			for (var k = 0; k< fixtPatch.length; k++) {
				newPatch[chanName].push(parseInt(fixtPatch[k])+data.channelOffset);
			}
		}
	}
	patch = newPatch;
	fixturesData = newFixturesData;
}





function createCVMapping() {
	updateData();
	var name = mappingNameInput.get();
	var customVariableGroup = root.customVariables.addItem();
	var groupName = "Values "+name;
	customVariableGroup.setName(groupName);

	var mappingState = root.states.addItem("State");
	mappingState.setName("Mappings - "+name);

	var dataType = CVmappingType.get();

	var allowedParams = mappingChannelFilter.get();
	var allParams = false;
	if (allowedParams.trim() == "") {
		allParams = true;
	} else {
		allowedParams = allowedParams.split(",");
		for (var i = 0; i< allowedParams.length; i++) {
			allowedParams[i] = allowedParams[i].trim();
			script.log(allowedParams[i]);
		}
	}

	var fixtures = util.getObjectProperties(fixturesData);
	for (var i = 0; i< fixtures.length; i++) {
		var fixtureName = fixtures[i];
		var fixture = fixturesData[fixtureName];
		var channels = fixture.channels;
		for (var j = 0; j< channels.length; j++) {
			var paramName = channels[j].name;
			// script.log(paramName+" "+allowedParams.indexOf(paramName));
			if (allParams || allowedParams.indexOf(paramName) >= 0) {
				var type = channels[j].type;
				var displayName = fixtureName+" "+paramName;
				var customVariable;
				if (type == "i8") {
					customVariable = customVariableGroup.variables.addItem('Float Parameter');
					customVariable.setName(displayName);
					customVariable.newFloatParameter.setRange(0,1);

					var hack = customVariable.getControlAddress().split("/");
					var target = "/customVariables/customVariables/values/"+hack[2]+"/"+hack[4];
					var m = mappingState.processors.addItem("Mapping");
					m.setName(displayName);
					var inputVal = m.inputs.addItem("InputValue");
					inputVal.inputValue.set(target);

					var output = m.outputs.addItem("MappingOutput");
					var command = output.setCommand(local.name, "", "Set "+dataType+" Value");
					command.fixture.set(fixtureName);
					command.parameter.set(paramName);
					command.dataType.setData("i8");
					command.slot.set(name);
					command.linkParamToMappingIndex(command.valueDimmer8bits, 0);

				} else if (type == "i16") {
					customVariable = customVariableGroup.variables.addItem('Float Parameter');
					customVariable.setName(displayName);
					customVariable.newFloatParameter.setRange(0,1);

					var hack = customVariable.getControlAddress().split("/");
					var target = "/customVariables/customVariables/values/"+hack[2]+"/"+hack[4];
					var m = mappingState.processors.addItem("Mapping");
					m.setName(displayName);
					var inputVal = m.inputs.addItem("InputValue");
					inputVal.inputValue.set(target);

					var output = m.outputs.addItem("MappingOutput");
					var command = output.setCommand(local.name, "", "Set "+dataType+" Value");
					command.fixture.set(fixtureName);
					command.parameter.set(paramName);
					command.dataType.setData("i16");
					command.slot.set(name);
					command.linkParamToMappingIndex(command.valueDimmer16bits, 0);

				} else if (type == "rgb8") {
					customVariable = customVariableGroup.variables.addItem('Color Parameter');
					customVariable.setName(displayName);

					var hack = customVariable.getControlAddress().split("/");
					var target = "/customVariables/customVariables/values/"+hack[2]+"/"+hack[4];
					var m = mappingState.processors.addItem("Mapping");
					m.setName(displayName);
					var inputVal = m.inputs.addItem("InputValue");
					inputVal.inputValue.set(target);

					var output = m.outputs.addItem("MappingOutput");
					var command = output.setCommand(local.name, "", "Set "+dataType+" Value");
					command.fixture.set(fixtureName);
					command.parameter.set(paramName);
					command.dataType.setData("rgb8");
					command.slot.set(name);
					command.linkParamToMappingIndex(command.valueRGB8bits, 0);

				} else if (type == "rgb16") {
					customVariable = customVariableGroup.variables.addItem('Color Parameter');
					customVariable.setName(displayName);

					var hack = customVariable.getControlAddress().split("/");
					var target = "/customVariables/customVariables/values/"+hack[2]+"/"+hack[4];
					var m = mappingState.processors.addItem("Mapping");
					m.setName(displayName);
					var inputVal = m.inputs.addItem("InputValue");
					inputVal.inputValue.set(target);

					var output = m.outputs.addItem("MappingOutput");
					var command = output.setCommand(local.name, "", "Set "+dataType+" Value");
					command.fixture.set(fixtureName);
					command.parameter.set(paramName);
					command.dataType.setData("rgb16");
					command.slot.set(name);
					command.linkParamToMappingIndex(command.valueRGB16bits, 0);
				} else {}
			}


		}
	}
	return; 


}


function createFX () {
	var slotName = FXSlotName.get();
	var fixtName = FXFixtName.get();
	var sequenceValue = "/sequences"+FXSequence.get();
	if (!sequenceValue) {return;}
	var seqData = getLayerAndSequence(controlAdressToElement(sequenceValue));

	var stateFX = root.states.addItem("State");
	stateFX.setName("New FX");

	var mappingFX = stateFX.processors.addItem("Mapping");
	mappingFX.setName("FX Values");
	var inputVal = mappingFX.inputs.addItem("InputValue");
	inputVal.inputValue.set(seqData.sequence.getControlAddress()+"/currentTime");

	var output = mappingFX.outputs.addItem("MappingOutput");
	var command = output.setCommand(local.name, "", "Effect");

	var fixtures = util.getObjectProperties(fixturesData);
	var fixturesInput = [];
	for (var i = 0; i< fixtures.length; i++) {
		if (fixtures[i].substring(0, fixtName.length) == fixtName) {
			fixturesInput.push(fixtures[i]);
		}
	}

	command.fixtures.set(fixturesInput.join(", "));
	command.mode.set("FX");
	command.slot.set(slotName);
	command.sequenceValue.set(sequenceValue);




	var mappingSlot = stateFX.processors.addItem("Mapping");
	mappingSlot.setName("Slot Level");
	var slotInputVal = mappingSlot.inputs.addItem("InputValue");

	var slotOutput = mappingSlot.outputs.addItem("MappingOutput");
	var slotCommand = slotOutput.setCommand(local.name, "", "Set Slot Level");

	slotCommand.slot.set(slotName);
	slotCommand.linkParamToMappingIndex(slotCommand.value, 0);

}













function getContainerChildWithName(element, name) {
	script.log("searching for "+name);
	var children = getChildrenContainers(element);
	for (var i = 0; i < children.length; i++) {
		var child = children[i];
		script.log(child.niceName);
		if (child.niceName == name) {
			script.log("yataa");
			return child;
		}
	}
}

function reloadObjects() {
	fixturesTypesContainer = local.getChild("Parameters").getChild("fixtureTypes");
	fixturesContainer = local.getChild("Parameters").getChild("Fixtures");
}

function explode(v) {
	script.log("  ");
	script.log(" proprietes : ");
	var content = util.getObjectProperties(v);
	for (var i = 0; i< content.length; i++) {
		script.log("  - "+content[i]+" : "+v[content[i]]);
	}

	script.log(" methodes : ");
	content = util.getObjectMethods(v);
	for (var i = 0; i< content.length; i++) {
		script.log("  - "+content[i]);
	}
	script.log("  ");
}

function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function getChildrenContainers(parent) {
	var ret = [];
	var keys = util.getObjectProperties(parent);
	for (var i = 0; i < keys.length; i++ ) {
		if (parent[keys[i]]._type == "Container") {
			ret.push(parent[keys[i]]);
		}
	}
	return ret;
}

function verifButtons() {
	reloadObjects();

	var types = getChildrenContainers(fixturesTypesContainer);
	for (var i = 0; i< types.length; i++) {
		types[i].addTrigger("Add Parameter", "Create a new parameter for this fixture");
		types[i].addTrigger("Delete fixture type", "Delete this fixture type");
		var params = getChildrenContainers(types[i]);
		for (var j = 0; j< params.length; j++) {
			params[j].addTrigger("Remove Parameter", "Remove this parameter");
		}
	}

	var fixtures = getChildrenContainers(fixturesContainer);
	for (var i = 0; i< fixtures.length; i++) {
		fixtures[i].addTrigger("Delete fixture", "Delete this fixture");
	}

}