//TODO:
// -dass der der angegebene Punkt immer die Raummitte ist
// -dass Door2Door fehlerfrei, trotz aller rotationen klappt
// -Doors, Statics, fires, lamps, etc. alle  zu ner eigenen art Segment hinzuf�gen. Daf�r mit anderen Gruppen kurzschlie�en
// -Dass der nicht immer 2 T�ren in nen Doppelt genutzten T�rrahmen packt
// -Dass er all das was ich so manuell eingebe aus der levels.xml liest


//consts (change iff you know what you're doing! :P)
var ROOMSXML = "rooms.xml"
var OBJECTSXML = "objects.xml"
var LEVELSXML = "levels.xml"
var SKALIERUNGSFAKTOR = 20;
var HOLZTURBREITE = SKALIERUNGSFAKTOR*0.88;
var GLASTURBREITE = SKALIERUNGSFAKTOR*1.2;
var KLOTUERBREITE = SKALIERUNGSFAKTOR*1;
var DOORSKALIERUNG = 1.0;
var FIRETEXTUREPATH = './levels/materials/textures/';
var MAXTIMEOUT = 10000;

//global vars
var scene_items = []; //hier stehen S�TMLICHE Referenzen der Mashes der R�ume,Objekte,Feuer,etc, welche aktuell angezeigt (in der scene) sind. Dadurch kann man sich alle nach Bedarf auflisten lassen, ver�ndern & l�schen
var segments = [];    //hier stehen alle Segments drin. Segment = Teil des AVZs mit Infos �ber position usw.
var static_obj = [];  //hier stehen alle StaticSegments drin. StaticSegment = Objekte welche Teil der Szene sind (auch mit Infos �ber position etc) (closed Doors auch!) (KEINE LAMPEN!)
var interact_obj = [];//hier stehen alle interactibleSegments drin. Das sind alle PickupItems, T�ren ungleich closedDoor, und sonstwie interactibles.
var lamps = [];	//noch sinnlos!  //Hier stehen alle LightSegments drin. Diese bestehen aus dem mesh der Lampe (+position etc) sowie der Lichtquelle als three.light!
var fires = [];       //Hier stehen alle Feuer drin.
var triggers = [];	  //Hier stehen alle Triggers drin.
var allobjects = [];  listallobjects();  //hierdrin stehen alle M�GLICHEN objects (..damit man sie nicht mehr aus der xml auslesen kann, asynchronit�t undso.)
var allrooms = []; listallrooms(); //same as line above.


//functions

//this function takes as input the name of a room, and adds to the "segments"-array the object containing its info + mesh (no return value due to asynchrony)
//the callback-function WAS ORIGINALLY MEANT TO BE nothing, fitdoor or the one loading the info from the levels.xml
//now, it loads all the other stuff (lights, audios, etc.)
	function CreateSegment(forwhichroom, callback) {
		var currseg = {filename:"", doors:[], spawns:[], lights:[], fires:[], triggers: [], xmin:0, ymin:0, xmax:0, ymax:0, orx:0, ory:0, orz: 0, transx:0, transy:0, rot:0, rauch: 0, applied:false};
		if (typeof callback !== 'function')
		{
			currseg.transx = 0;
			currseg.transy = 0;
			currseg.rot = 0;
		}
		segments.push(currseg);
		if (typeof callback === 'function') {
			loadStuff(forwhichroom,segments.length-1, callback); //callback is either fitdoor (which packs a segment door2door to a previous one) OR gets tranx,transy&rot von der levels.xml
		} else {
			loadStuff(forwhichroom,segments.length-1);
		}
	}

	function CreateSegment(forwhichroom, callback, x, y, rot) {
		var currseg = {filename:"", doors:[], spawns:[], lights:[], fires:[], triggers: [], xmin:0, ymin:0, xmax:0, ymax:0, orx:0, ory:0, orz: 0, transx:0, transy:0, rot:0, rauch: 0, applied:false};
		if (typeof callback !== 'function')
		{
			currseg.transx = x;
			currseg.transy = y;
			currseg.rot = rot;
		}
		segments.push(currseg);
		if (typeof callback === 'function') {
			loadStuff(forwhichroom,segments.length-1, callback); //callback is either fitdoor (which packs a segment door2door to a previous one) OR gets tranx,transy&rot von der levels.xml
		} else {
			loadStuff(forwhichroom,segments.length-1);
		}
	}

//this function will be done as soon as the leveldesign group is done.
	function getTransRotFromXML(){
		//gets called as callback from createsegment. (REALLY?)
		//returns [x,y,rot]
	}

//loads everything needed from the rooms.xml file (and then calls the followup-functions)
	function loadStuff(whichroom, segmentindex, callback) {

		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				getDoors(xhttp,segmentindex,whichroom,spawns);
			}
			function spawns () {
				getSpawns(xhttp,segmentindex,whichroom,lights);
				function lights () {
					getLights(xhttp,segmentindex,whichroom,fires);
					function fires () {
						getFires(xhttp,segmentindex,whichroom,coords);
						function coords() {
							getCoords(xhttp,segmentindex,whichroom,triggers);
							function triggers() {
								getTriggers(xhttp,segmentindex,whichroom,fileName);
								function fileName() {
									getFileName(xhttp,segmentindex,whichroom,callback); //this function calls, when done, the function to create and add the mesh.
								}
							}
					// typeof callback === 'function' && callback(); //if there is a callback specified, run it.
						}
					}
				}
			}
		};
		xhttp.open("GET", ROOMSXML, true);
		xhttp.send();

	}

//these functions read specific things from the rooms.xml-file and chain one after the other
	function getDoors(xml, segmentindex, whichroom,callback) {
		var DoorArr = [];
		var xmlDoc = xml.responseXML;
		var curroom = xmlDoc.getElementsByTagName("room");
		for (var i = 0; i <curroom.length; i++) {
			if (curroom[i].getAttribute("name") === whichroom) {
				var curdoor = curroom[i].getElementsByTagName("door");
				for (var j = 0; j < curdoor.length; j++) {
					var cudo = [];
					cudo.push(curdoor[j].getAttribute("index"));
					cudo.push((curdoor[j].getAttribute("type") !== null) ? curdoor[j].getAttribute("type") : "norm");
					cudo.push(curdoor[j].getAttribute("position"));
					cudo.push(curdoor[j].getAttribute("normal"));
					cudo.push((curdoor[j].getAttribute("act") !== null) ? curdoor[j].getAttribute("act") : "open");
					cudo.push((curdoor[j].getAttribute("stretch") !== null) ? curdoor[j].getAttribute("stretch") : 1);
					DoorArr.push(cudo);
				}
			}
		}
		segments[segmentindex].doors = DoorArr;
		callback();
	}

	function getSpawns(xml, segmentindex, whichroom,callback) {
		var SpawnArr = [];
		var xmlDoc = xml.responseXML;
		var curroom = xmlDoc.getElementsByTagName("room");
		for (var i = 0; i <curroom.length; i++) {
			if (curroom[i].getAttribute("name") === whichroom) {
				var curdoor = curroom[i].getElementsByTagName("spawn");
				for (var j = 0; j < curdoor.length; j++) {
					var first = 0; var second = 0; var third = 0;
					if (curdoor[j].getAttribute("position").indexOf("to") > 0) {
						parts = curdoor[j].getAttribute("position").split("(")[1].split(")")[0].split(",");
						var x = []; var y = []; var z = [];
						for (var k = 0; k < parts.length; k++) {
							if (parts[k].indexOf("to") > 0) {
								first = parseFloat(parts[k].split(" to ")[0]);
								second = parseFloat(parts[k].split(" to ")[1].split(" step ")[0]);
								third = parseFloat(parts[k].split(" to ")[1].split(" step ")[1]);
								for (var l = first; l <= second; l+= third) {
									switch(k){
										case 0: x.push(l); break;
										case 1: y.push(l); break;
										case 2: z.push(l); break;
									}
								}
							} else {
								switch(k){
									case 0: x.push(parts[k]); break;
									case 1: y.push(parts[k]); break;
									case 2: z.push(parts[k]); break;
								}
							}
						}
						var p = 0;
						for (var m = 0; m < x.length; m++) {
							for (var n = 0; n < y.length; n++) {
								for (var o = 0; o < z.length; o++) {
									var cudo = [];
									cudo.push(curdoor[j].getAttribute("index")+""+p);
									cudo.push("("+x[m]+","+y[n]+","+z[o]+")");
									cudo.push(curdoor[j].getAttribute("object"));
									cudo.push(curdoor[j].getAttribute("normaltowall"));
									cudo.push((curdoor[j].getAttribute("scale") !== null) ? curdoor[j].getAttribute("scale") : 1);
									cudo.push((curdoor[j].getAttribute("oninteract") !== "") ? curdoor[j].getAttribute("oninteract") : "");
									SpawnArr.push(cudo);
									p++;
								}
							}
						}
					} else {
						var cudo = [];
						cudo.push(curdoor[j].getAttribute("index"));
						cudo.push(curdoor[j].getAttribute("position"));
						cudo.push(curdoor[j].getAttribute("object"));
						cudo.push(curdoor[j].getAttribute("normaltowall"));
						cudo.push((curdoor[j].getAttribute("scale") !== null) ? curdoor[j].getAttribute("scale") : 1);
						cudo.push((curdoor[j].getAttribute("oninteract") !== "") ? curdoor[j].getAttribute("oninteract") : "");
						SpawnArr.push(cudo);
					}
				}
			}
		}
		segments[segmentindex].spawns = SpawnArr;
		callback();
	}

	function getLights(xml, segmentindex, whichroom,callback) {
		var LightArr = [];
		var xmlDoc = xml.responseXML;
		var curroom = xmlDoc.getElementsByTagName("room");
		for (var i = 0; i <curroom.length; i++) {
			if (curroom[i].getAttribute("name") === whichroom) {
				var curdoor = curroom[i].getElementsByTagName("light");
				for (var j = 0; j < curdoor.length; j++) {
					var cudo = [];
					cudo.push(curdoor[j].getAttribute("index"));
					cudo.push((curdoor[j].getAttribute("kind") !== null) ? curdoor[j].getAttribute("kind") : "pointlight");
					cudo.push((curdoor[j].getAttribute("objectname") !== null) ? curdoor[j].getAttribute("objectname") : "deckenlicht");
					cudo.push((curdoor[j].getAttribute("objectscale") !== null) ? curdoor[j].getAttribute("objectscale") : 1);
					cudo.push(curdoor[j].getAttribute("position"));
					cudo.push(curdoor[j].getAttribute("normal"));
					cudo.push((curdoor[j].getAttribute("intensity") !== null) ? curdoor[j].getAttribute("intensity") : 0.1);
					cudo.push((curdoor[j].getAttribute("color") !== null) ? curdoor[j].getAttribute("color") : 0xFFFFFF);
					cudo.push((curdoor[j].getAttribute("visiblewidth") !== null) ? curdoor[j].getAttribute("visiblewidth") : 30);
					LightArr.push(cudo);
				}
			}
		}
		segments[segmentindex].lights = LightArr;
		callback();
	}

	function getFires(xml, segmentindex, whichroom,callback) {
		var FireArr = [];
		var xmlDoc = xml.responseXML;
		var curroom = xmlDoc.getElementsByTagName("room");
		for (var i = 0; i <curroom.length; i++) {
			if (curroom[i].getAttribute("name") === whichroom) {
				var curdoor = curroom[i].getElementsByTagName("fire");
				for (var j = 0; j < curdoor.length; j++) {
					var cudo = [];
					cudo.push(curdoor[j].getAttribute("index"));
					cudo.push(curdoor[j].getAttribute("position"));
					cudo.push(curdoor[j].getAttribute("size"));
					cudo.push((curdoor[j].getAttribute("val") !== null) ? curdoor[j].getAttribute("val") : 20);
					FireArr.push(cudo);
				}
			}
		}
		segments[segmentindex].fires = FireArr;
		callback();
	}

	function getCoords(xml, segmentindex, whichroom,callback) {
		var xmlDoc = xml.responseXML;
		var curroom = xmlDoc.getElementsByTagName("room");
		for (var i = 0; i <curroom.length; i++) {
			if (curroom[i].getAttribute("name") === whichroom) {
				sizeinfo = curroom[i].getElementsByTagName("size");
				segments[segmentindex].xmin = sizeinfo[0].getAttribute("xmin");
				segments[segmentindex].xmax = sizeinfo[0].getAttribute("xmax");
				segments[segmentindex].ymin = sizeinfo[0].getAttribute("ymin");
				segments[segmentindex].ymax = sizeinfo[0].getAttribute("ymax");
				origininfo = curroom[i].getElementsByTagName("origin");
				segments[segmentindex].orx = origininfo[0].getAttribute("x");
				segments[segmentindex].ory = origininfo[0].getAttribute("y");
				segments[segmentindex].orz = origininfo[0].getAttribute("z");
			}
		}
		callback();
	}

	function getTriggers(xml, segmentindex, whichroom, callback) {
		var TriggerArr = [];
		var xmlDoc = xml.responseXML;
		var curroom = xmlDoc.getElementsByTagName("room");
		for (var i = 0; i <curroom.length; i++) {
			if (curroom[i].getAttribute("name") === whichroom) {
				var curdoor = curroom[i].getElementsByTagName("trigger");
				for (var j = 0; j < curdoor.length; j++) {
					var cudo = [];
					cudo.push(curdoor[j].getAttribute("index"));
					cudo.push(curdoor[j].getAttribute("xpos"));
					cudo.push(curdoor[j].getAttribute("ypos"));
					cudo.push(curdoor[j].getAttribute("size"));
					cudo.push((curdoor[j].getAttribute("functionname") !== null) ? curdoor[j].getAttribute("functionname") : "showThoughts");
					cudo.push((curdoor[j].getAttribute("fparam1") !== null) ? curdoor[j].getAttribute("fparam1") : "");
					cudo.push((curdoor[j].getAttribute("fparam2") !== null) ? curdoor[j].getAttribute("fparam2") : "");
					TriggerArr.push(cudo);
				}
			}
		}
		segments[segmentindex].triggers = TriggerArr;
		callback();

	}




	function getFileName(xml, segmentindex, whichroom,callback) {
		var xmlDoc = xml.responseXML;
		var curroom = xmlDoc.getElementsByTagName("room");
		for (var i = 0; i <curroom.length; i++) {
			if (curroom[i].getAttribute("name") === whichroom) {
				segments[segmentindex].filename = curroom[i].getAttribute("filename");
				addmesh(curroom[i].getAttribute("filename"), segmentindex);
			}
		}
		callback();
	}
//"these functions" end.

//puts the objects in its spawn-location  //TODO: normaltowall ist nicht die normale zur wand, sondern die normale blender-normale :/
	function objects_in_spawns(callback) {
		for (var INDEX1 = 0; INDEX1<segments.length; INDEX1++){
			for (var i = 0; i <segments[INDEX1].spawns.length; i++) {
				tospawn = segments[INDEX1].spawns[i];

				room1pos = [segments[INDEX1].transx, segments[INDEX1].transy];

				var spawnx = parseFloat(tospawn[1].slice(1,tospawn[1].indexOf(',')));
				var spawny = parseFloat(tospawn[1].slice(tospawn[1].indexOf(',')+1,tospawn[1].lastIndexOf(',')));
				var spawnz = parseFloat(tospawn[1].slice(tospawn[1].lastIndexOf(',')+1,tospawn[1].indexOf(')')));

				spawnx = spawnx*SKALIERUNGSFAKTOR;
				spawny = spawny*SKALIERUNGSFAKTOR*-1;
				spawnz = spawnz*SKALIERUNGSFAKTOR;

				for (var j = 0; j <parseInt(segments[INDEX1].rot); j++) { //rotieren, pro 90� gilt: y <- x & x <- -y
					var tmp = spawnx;
					spawnx = -spawny;
					spawny = tmp;
				}

				var vector = tospawn[3];
				rotate = vec2dir([parseFloat(vector.slice(1,vector.indexOf(','))),parseFloat(vector.slice(vector.indexOf(',')+1,vector.indexOf(')')))]);
				rotate -= segments[INDEX1].rot;

				var xz = changexzaccordingtorot(segments[INDEX1].orx, segments[INDEX1].ory, segments[INDEX1].rot);
				spawnx = spawnx + parseInt(segments[INDEX1].transx)+xz[0];
				spawny = spawny + parseInt(segments[INDEX1].transy)+xz[1];

				var what = (tospawn[5] == null) ? "static" : "interactible"
				addObjectViaName(tospawn[2], what, spawnx, spawny, spawnz, tospawn[4], rotate, tospawn[5]); //4: scale | 5: oninteract/""
			}
		}
		callback();
	}

//puts the fires where they belong
	function set_fires(callback) {
		for (var INDEX1 = 0; INDEX1<segments.length; INDEX1++){

			var fire = segments[INDEX1].fires;
			for (var i = 0; i <fire.length; i++) {

				var spawnx = parseFloat(fire[i][1].slice(1,fire[i][1].indexOf(',')));
				var spawny = parseFloat(fire[i][1].slice(fire[i][1].indexOf(',')+1,fire[i][1].lastIndexOf(',')));
				var spawnz = parseFloat(fire[i][1].slice(fire[i][1].lastIndexOf(',')+1,fire[i][1].indexOf(')')));

				var sizex = parseFloat(fire[i][2].slice(1,fire[i][2].indexOf(',')));
				var sizey = parseFloat(fire[i][2].slice(fire[i][2].indexOf(',')+1,fire[i][2].lastIndexOf(',')));
				var sizez = parseFloat(fire[i][2].slice(fire[i][2].lastIndexOf(',')+1,fire[i][2].indexOf(')')));

				spawnx = spawnx*SKALIERUNGSFAKTOR;
				spawny = spawny*SKALIERUNGSFAKTOR*-1;
				spawnz = spawnz*SKALIERUNGSFAKTOR;

				for (var j = 0; j <parseInt(segments[INDEX1].rot); j++) { //rotieren, pro 90� gilt: y <- x & x <- -y
					var tmp = spawnx;
					spawnx = -spawny;
					spawny = tmp;
				}

				var xz = changexzaccordingtorot(segments[INDEX1].orx, segments[INDEX1].ory, segments[INDEX1].rot);
				spawnx = spawnx + parseInt(segments[INDEX1].transx)+xz[0];
				spawny = spawny + parseInt(segments[INDEX1].transy)+xz[1];

				createFire(spawnx, spawny, spawnz, sizex, sizez, sizey, (weaksystem)?fire[i][3]*20:fire[i][3]); //ja, ist richtig so mit x,y,z

			}
		}
		animateFire();
		callback();
	}

	function createFire(x, z, y, sx, sy, sz, s) {
		VolumetricFire.texturePath = FIRETEXTUREPATH;
		var fireseg = {x:x, y:y, z:z, sx:sx*SKALIERUNGSFAKTOR, sy:sy*SKALIERUNGSFAKTOR, sz:sz*SKALIERUNGSFAKTOR, val:s*SKALIERUNGSFAKTOR}; //TODO: kann ich auch das mesh des feuers adden?
		fires.push(fireseg);

		addFire(x, y, z, sx*SKALIERUNGSFAKTOR, sy*SKALIERUNGSFAKTOR, sz*SKALIERUNGSFAKTOR, s*SKALIERUNGSFAKTOR);
	}

//puts the lights where they belong
	function turn_on_lights(callback) {
		for (var INDEX1 = 0; INDEX1<segments.length; INDEX1++){

			var light = segments[INDEX1].lights;
			for (var i = 0; i <light.length; i++) {

				var spawnx = parseFloat(light[i][4].slice(1,light[i][4].indexOf(',')));
				var spawny = parseFloat(light[i][4].slice(light[i][4].indexOf(',')+1,light[i][4].lastIndexOf(',')));
				var spawnz = parseFloat(light[i][4].slice(light[i][4].lastIndexOf(',')+1,light[i][4].indexOf(')')));


				spawnx = spawnx*SKALIERUNGSFAKTOR;
				spawny = spawny*SKALIERUNGSFAKTOR*-1;
				spawnz = spawnz*SKALIERUNGSFAKTOR;

				for (var j = 0; j <parseInt(segments[INDEX1].rot); j++) { //rotieren, pro 90� gilt: y <- x & x <- -y
					var tmp = spawnx;
					spawnx = -spawny;
					spawny = tmp;
				}

				var xz = changexzaccordingtorot(segments[INDEX1].orx, segments[INDEX1].ory, segments[INDEX1].rot);
				spawnx = spawnx + parseInt(segments[INDEX1].transx)+xz[0];
				spawny = spawny + parseInt(segments[INDEX1].transy)+xz[1];

				//TODO: ist das �berhaupt das pendant zum normaltowall der spawns? Sollte ne Lampe nicht noch zus�tzlich nen Vector "direction" haben?
				var vector = light[i][5];
				rotate = vec2dir([parseFloat(vector.slice(1,vector.indexOf(','))),parseFloat(vector.slice(vector.indexOf(',')+1,vector.indexOf(')')))]);
				rotate -= segments[INDEX1].rot;

				//TODO: Lampen auch noch zu einem lampen-segment hinzuf�gen!!
				addObjectViaName(light[i][2], "lamp", spawnx, spawny, spawnz, light[i][3], rotate, "");
				addLight(spawnx, spawnz, spawny, light[i][1], light[i][5], light[i][6], light[i][7], light[i][8]);
			}
		}
		callback();
	}

	function addLight(x, y, z, kind, normal, intensity, color, visiblewidth){

		var light = new THREE.PointLight( parseInt(color), intensity, visiblewidth*SKALIERUNGSFAKTOR );
		light.position.set(x, y, z);

		scene.add(light);
	}

	function addtriggers(callback) {
		// addTrigger(0,-50,partial(showThoughts, "Hello World",5000));
		// [index,xpos,ypos,functionname,fparam1,fparam2]
		for (var INDEX1 = 0; INDEX1<segments.length; INDEX1++){
			for (var i = 0; i <segments[INDEX1].triggers.length; i++) {

				tospawn = segments[INDEX1].triggers[i];
				room1pos = [segments[INDEX1].transx, segments[INDEX1].transy];

				var spawnx = tospawn[1];
				var spawny = tospawn[2];
				var spawnz = 0

				spawnx = spawnx*SKALIERUNGSFAKTOR;
				spawny = spawny*SKALIERUNGSFAKTOR*-1;
				spawnz = spawnz*SKALIERUNGSFAKTOR;

				for (var j = 0; j <parseInt(segments[INDEX1].rot); j++) { //rotieren, pro 90� gilt: y <- x & x <- -y
					var tmp = spawnx;
					spawnx = -spawny;
					spawny = tmp;
				}

				var xz = changexzaccordingtorot(segments[INDEX1].orx, segments[INDEX1].ory, segments[INDEX1].rot);
				spawnx = spawnx + parseInt(segments[INDEX1].transx)+xz[0];
				spawny = spawny + parseInt(segments[INDEX1].transy)+xz[1];

				var size = tospawn[3]*SKALIERUNGSFAKTOR;
				var functPtr = eval(tospawn[4]);
				var fparam1 = tospawn[5];
				var fparam2 = tospawn[6];


				if (fparam1 === "") addTrigger(spawnx, spawny, size, functPtr)
					else if (fparam2 === "") addTrigger(spawnx, spawny, size, partial(functPtr, fparam1))
						else addTrigger(spawnx, spawny, size, partial(functPtr, fparam1, fparam2))
			}
		}
		callback();

	}


//puts the right kind of door where it fits.
function door_in_doors(callback) {
	for (var INDEX1 = 0; INDEX1<segments.length; INDEX1++){
		for (var i = 0; i <segments[INDEX1].doors.length; i++) {
			room1door = segments[INDEX1].doors[i];
			room1pos = [segments[INDEX1].transx, segments[INDEX1].transy];

			if (room1door[1] == "floor") {return;} //floor-t�ren enthalten schlicht keine t�r.

			var vector = room1door[3];
			rotate = vec2dir([parseFloat(vector.slice(1,vector.indexOf(','))),parseFloat(vector.slice(vector.indexOf(',')+1,vector.indexOf(')')))]);

			var changex;
			if (room1door[1] === "norm") {changex = HOLZTURBREITE;}
			else if (room1door[1] === "glass") {changex = GLASTURBREITE; }
			else if (room1door[1] === "klotuer") {changex = KLOTUERBREITE; }
			changex = changex*(1+0.5*(room1door[5]-1)); //room1door[5] ist der stretch-faktor
			var changey = 0;
			for (var j = 0; j <parseInt(rotate); j++) { //rotieren, pro 90� gilt: y <- x & x <- -y
				var tmp = changex;
				changex = -changey;
				changey = tmp;
			}
			if ((parseInt(segments[INDEX1].rot) == 3) || (parseInt(segments[INDEX1].rot) == 1)) {changey = -changey; changex = -changex};

			var door1x = parseFloat(room1door[2].slice(1,room1door[2].indexOf(',')));
			var door1y = parseFloat(room1door[2].slice(room1door[2].indexOf(',')+1,room1door[2].indexOf(')')));
			door1x = door1x*SKALIERUNGSFAKTOR+changex;
			door1y = door1y*SKALIERUNGSFAKTOR*-1+changey;

			for (var j = 0; j <parseInt(segments[INDEX1].rot); j++) { //rotieren, pro 90� gilt: y <- x & x <- -y
				var tmp = door1x;
				door1x = -door1y;
				door1y = tmp;
			}
			var xz = changexzaccordingtorot(segments[INDEX1].orx, segments[INDEX1].ory, segments[INDEX1].rot);

			door1x = door1x + parseInt(segments[INDEX1].transx)+xz[0];
			door1y = door1y + parseInt(segments[INDEX1].transy)+xz[1];

			var doorkind ="";
			switch(room1door[1]){
				case "norm": doorkind = "holztur"; break;
				case "glass": doorkind = "glastur"; break;
				case "klotuer": doorkind = "klotur"; break;
			}

			var act = "";
			switch(room1door[4]) {
				case "openable": act = "open"; break;
				case "open": act = "openopened"; rotate -= 1; break;
				case "transponderopenable": act = "openTransponderDoor"; break;
				case "axtopenable": act = "damageDoor"; break;
				case "codeopenable": act = "openLockedDoor"; break;
			}
			if (godmode) {act = "openopened"; rotate -= 1;};

			for (var j = 0; i < interact_obj.length; i++) {
				if ((Math.abs(interact_obj[i].x - door1x) > 5) && (Math.abs(interact_obj[i].y - door1y) > 5))
				{
					return; //keine t�r adden wo schon eine ist.
				}
			}


			addObjectViaName(doorkind, "door", door1x, door1y, 0, DOORSKALIERUNG, rotate-segments[INDEX1].rot, act, room1door[5])
			if (doorkind == "glastur") {addObjectViaName("glastuerrahmen", "static", door1x, door1y, 0, DOORSKALIERUNG, (act==="openopened")?rotate-segments[INDEX1].rot+1:rotate-segments[INDEX1].rot, "", room1door[5])  }
		}
	}
	callback();
}


	//TODO: diese Funktionen. In synchron. Am besten per globalen Variablen (...daf�r checken die Funktionen vorher ob die Variablen != "")
	function objectFilenameToName(filename){
		// for (var i = 0; i < allobjects.length; i++) {  //w�rde ich gerne so machen, aber aufgrund von kompatibilit�t zu den anderen... :/
			// if (allobjects[i].path === filename) return allobjects[i].name
		// }
		var tName = filename.split("/");
		tName = tName[tName.length-1].split(".")[0];  //TODO: bei einigen Objekten ist der Name ungleich dem Filenamen! Das hier ist nur die Notl�sung!
		return tName;
	}

	function objectNameToFilename(name){
		for (var i = 0; i < allobjects.length; i++) {
			if (allobjects[i].name === name) return allobjects[i].path
		}
	}

	function roomFilenameToName(filename){
		// for (var i = 0; i < allrooms.length; i++) {
			// if (allrooms[i].path === filename) return allrooms[i].name
		// }
		var tName = filename.split("/");
		tName = tName[tName.length-1].split(".")[0];	//TODO: bei einigen Objekten ist der Name ungleich dem Filenamen! Das hier ist nur die Notl�sung!
		return tName;
	}

	function roomNameToFilename(name){
		for (var i = 0; i < allrooms.length; i++) {
			if (allrooms[i].name === name) return allrooms[i].filename
		}
	}


//needed for other functions, (to turn objects)
	function vec2dir(vec){
		if (vec[0] == -1 && vec[1] == 0) {return 3}
		else if (vec[0] == 1 && vec[1] == 0) {return 1}
		else if (vec[0] == 0 && vec[1] == -1) {return 2}
		else {return 0} //if (vec[0] == 0 && vec[1] == 1)
	}

//needed for other functions, (to turn objects)
	function changexzaccordingtorot(orx,ory,rot){
		var xz = [0,0]
		if (rot == 0) {
			xz = [-(orx*SKALIERUNGSFAKTOR), (ory*SKALIERUNGSFAKTOR)];
		} else if (rot == 2) {
			xz = [(orx*SKALIERUNGSFAKTOR), -(ory*SKALIERUNGSFAKTOR)];
		} else if (rot == 1){
			xz = [(orx*SKALIERUNGSFAKTOR), (ory*SKALIERUNGSFAKTOR)];
		} else {
			xz = [-(orx*SKALIERUNGSFAKTOR), -(ory*SKALIERUNGSFAKTOR)];
		}
		return xz;
	}


//adds an OBJECT's mesh to the scene (needs to be changed when we stop loading from jsons directly and instead from the pre-loading-thingy.)
	function addobject(objectpfad, name, posx, posy, posz, scale, rotate, responsefunct, stretchx) {
		var intItem = null;
		var tName = objectFilenameToName(objectpfad);  //TODO: der fileLoader sollte auch einfach das argument name von hier nutzen, und intern nochmal ne name->filename mapfunktion haben!
		mesh = fileLoader.get(tName);
		mesh.scale.set(SKALIERUNGSFAKTOR*scale*stretchx,SKALIERUNGSFAKTOR*scale,SKALIERUNGSFAKTOR*scale);
		mesh.position.x = Math.round(posx);
		mesh.position.z = Math.round(posy); //IN BLENDER SIND Y UND Z ACHSE VERTAUSCHT
		mesh.position.y = Math.round(posz);
		mesh.rotation.y = 0.5*Math.PI*(4-rotate);

		if (name === "lamp") {
			//TODO: adde ein passendes segment f�r ne Lampe
		} else {
			if ((responsefunct != "") && (responsefunct != null)) {
				var functPtr = eval(responsefunct);
				intItem = new GameObject(mesh, functPtr, TYPE_INTERACTABLE, objectpfad);
				if (intItem == undefined) intItem = null;
				var segment = {filename:objectpfad, name: name, interIt: intItem, x: posx, y: posy, z: posz, skale: scale, rot: rotate, funct: responsefunct, msh: mesh};
				interact_obj.push(segment);
			} else {
				var segment = {filename:objectpfad, name: name, x: posx, y: posy, z: posz, skale: scale, rot: rotate, msh: mesh};
				static_obj.push(segment);
			}
		}
		addtoscene(mesh, intItem);
	}

	function addObjectViaName(objectname, objecttype, spawnx, spawny, spawnz, scale, rotate, actionfunction, stretchx) {
		if (stretchx === undefined) {stretchx = 1};
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				var xmlDoc = xhttp.responseXML;
				var pfad = xmlDoc.getElementsByTagName("objects")[0].getAttribute("ObjectPath");
				var typeItems = xmlDoc.getElementsByTagName(objecttype)[0].getElementsByTagName("object");
				if (objectname === objecttype) { //geht nur bei interactible&static
					var randomobject = pfad+typeItems[Math.round(Math.random()*(typeItems.length-1))];
					addobject(randomobject.getAttribute("path"), randomobject.getAttribute("name"), spawnx, spawny, spawnz, scale, rotate, actionfunction)
				} else {
					for (var i = 0; i < typeItems.length; i++) {
						if (typeItems[i].getAttribute("name") === objectname) {
							pfad += typeItems[i].getAttribute("path");
							addobject(pfad, objectname, spawnx, spawny, spawnz, scale*typeItems[i].getAttribute("scale"), rotate, actionfunction, stretchx)
						}
					}
				}
			}
		};
		xhttp.open("GET", OBJECTSXML, true);
		xhttp.send();
	}


//adds a ROOM's mesh to the scene (needs to be changed when we stop loading from jsons directly and instead from the pre-loading-thingy.)
	function addmesh(filename, segmentindex) {
		var h = filename.split("/"); //TODO: den fileloader so umschreiben dass er damit klar kommt
        var name = h[h.length-1].split(".")[0];
		segments[segmentindex].mesh = fileLoader.get(name);
		segments[segmentindex].mesh.scale.set(SKALIERUNGSFAKTOR,SKALIERUNGSFAKTOR,SKALIERUNGSFAKTOR);
	}


//BEFORE calling this function: in der segment steht "applied" auf false, und der raum steht noch im urpsrung (das mesh davon!)
//AFTER calling this: das mesh hat jetzt der Raum seine finale position. Damit man es nicht aus Versehen 2 mal aufruft, wird "applied" auf true gesetzt.
	function applytransrot(segment){
		if(!segment.applied) {

			var xz = changexzaccordingtorot(segment.orx, segment.ory, segment.rot);
			segment.mesh.position.x = xz[0];
			segment.mesh.position.z = xz[1];


			segment.mesh.rotation.y = 0.5*Math.PI*(4-segment.rot);

			segment.mesh.position.x = segment.mesh.position.x + parseInt(segment.transx);
			segment.mesh.position.z = segment.mesh.position.z + parseInt(segment.transy);  //IN BLENDER SIND Y UND Z ACHSE VERTAUSCHT
			//segment.mesh.position.y = -(segment.orz*SKALIERUNGSFAKTOR);
			segment.applied = true;
		}
		return segment.mesh;
	}

//not needed yet. W�RDE man aber eine die position eines segments ver�ndern wollen, m�sste man erst diese hier callen bevor man das neue transrot applien kann.
	function resettransrot(segment) {
		if(segment.applied)
		{
			segment.mesh.position.x = 0;
			segment.mesh.position.z = 0;
			segment.mesh.rotation.y = 0;
			segment.applied = false;
		}
		return segment.mesh;
	}

//l�scht erst alle objekte aus der Szene, bevor es dann alle neu hinzuf�gt.
	function PutSegments(callback){
		empty_scene();
		for (var i = 0; i <segments.length; i++) {
			addtoscene(applytransrot(segments[i]),null);

		}
	callback();
	}

//diese Funktion ist n�tig, da in der scene_items S�TMLICHE meshes der R�ume stehen (ihre referenz), welche gerade angezeigt sind. Dadurch kann man sich alle auflisten lassen, ver�ndern & l�schen nach Bedarf.
	function addtoscene(mesh, intItem){
		scene.add(mesh);
		if (intItem == null) {

			modifyOctree( mesh, true );
		} else {
			modifyOctree( intItem, true );
		}

		scene_items.push(mesh);
	}


//zum thema alle objekte aus der scene l�schen.
	function empty_scene(){
	  if(scene_items.length > 0 ) {
		scene_items.forEach(function(v,i) {  //TODO: anpassen auf neue struktur.
		   v.parent.remove(v);
		});
		scene_items = null;
		scene_items = [];
		static_obj = null;
		static_obj = [];
		interact_obj = null;
		interact_obj = [];
	  }
	}

	function remove_interactible(which){
		segmentIndex = interact_obj.indexOf(which);
		mesh = interact_obj[segmentIndex].msh;
		intObj = interact_obj[segmentIndex].interIt;
		interact_obj.splice(segmentIndex);
		i2 = scene_items.indexOf(mesh);
		scene_items.splice(i2);
		//scene.remove(mesh); braucht nicht, da das von interactible-this.delFromScene() gemacht wird.
	}






//buggy functions which may not even be needed


//diese Funktion klatscht einen Raum an einen anderen, wobei man angibt welche t�r (index innerhalb des segments) welchen raums (index der segments), an welche t�r welchen raum geklatscht wird.
//TODO: erstmal klappt das hier noch nicht (er packt immer den MITTELPUNKT des zweiten Raums an den T�rahmen des ersten), und zweitens noch die 4 indizes als Parameter �bergeben
	function fitdoor2door(){
		var INDEX1 = 0;
		var INDEX2 = segments.length-1;
		//TODO: f�gt immer das letzte an das erste, das ist nat�rlich noch nen bisschen K��se.

		room1door = segments[INDEX1].doors[document.getElementById('doornr').value];
		room2door = segments[INDEX2].doors[document.getElementById('doornr2').value]; //gucken ob der zweite index �berhaupt gleich ist (norm2norm,glas2glas etc)
		room1pos = [segments[INDEX1].transx, segments[INDEX1].transy];

		var rotation; //ok, abh�ngig der door-vektoren drehen wir. Es gibt: (-1,0),(0,-1),(1,0),(0,1)
		room1doorvec = [parseFloat(room1door[3].slice(1,room1door[3].indexOf(','))), parseFloat(room1door[3].slice(room1door[3].indexOf(',')+1,room1door[3].indexOf(')')))];
		room2doorvec = [parseFloat(room2door[3].slice(1,room2door[3].indexOf(','))), parseFloat(room2door[3].slice(room2door[3].indexOf(',')+1,room2door[3].indexOf(')')))];
		if (JSON.stringify(room1doorvec)==JSON.stringify(room2doorvec)) {rotation = parseInt(segments[INDEX1].rot)+2} //beide in die gleiche, drehe um 180�.
		else if ((room1doorvec[0] + room2doorvec[0] == 0) && (room1doorvec[1] + room2doorvec[1] == 0)) {rotation = parseInt(segments[INDEX1].rot)} //in entgegengesetzte, drehe nicht.
		else if (room1doorvec[0] + room2doorvec[0] + room1doorvec[1] + room2doorvec[1] == 2) {rotation = parseInt(segments[INDEX1].rot)+1}
		else {rotation = parseInt(segments[INDEX1].rot)+3};
		//1 und 3 k�nnten vertauscht sein


		var door1x = parseFloat(room1door[2].slice(1,room1door[2].indexOf(',')));
		var door1y = parseFloat(room1door[2].slice(room1door[2].indexOf(',')+1,room1door[2].indexOf(')')));
		door1x = door1x*SKALIERUNGSFAKTOR;
		door1y = door1y*SKALIERUNGSFAKTOR*-1;

		for (var j = 0; j <parseInt(segments[INDEX1].rot); j++) { //rotieren, pro 90� gilt: y <- x & x <- -y
			var tmp = door1x;
			door1x = -door1y;
			door1y = tmp;
		}
		var xz = changexzaccordingtorot(segments[INDEX1].orx, segments[INDEX1].ory, segments[INDEX1].rot);

		door1x = Math.round(door1x + parseInt(segments[INDEX1].transx)+xz[0]);
		door1y = Math.round(door1y + parseInt(segments[INDEX1].transy)+xz[1]);

		//remove me
		document.getElementById('posx').value = door1x;
		document.getElementById('posy').value = door1y;
		for (var j = 0; j <parseInt(segments[INDEX1].rot); j++) { //rotieren, pro 90� gilt: y <- x & x <- -y
			var tmp = door1x;
			door1x = -door1y;
			door1y = tmp;
		}
		var xz = changexzaccordingtorot(segments[INDEX1].orx, segments[INDEX1].ory, segments[INDEX1].rot);

		door1x = Math.round(door1x + parseInt(segments[INDEX1].transx)+xz[0]);
		door1y = Math.round(door1y + parseInt(segments[INDEX1].transy)+xz[1]);

		//remove me
		document.getElementById('posx').value = door1x;
		document.getElementById('posy').value = door1y;


		//so. w�rden wir jetzt den anderen raum an door1x, door1y packen, h�tte es dort seinen mittelpunkt.
		//Aber, es soll ja dort nicht seinen Mittelpunkt haben, sondern dort soll room2door liegen.
		//f�r rechts unten hei�t das, erst die koordinaten von mittelpunkt zu t�r addieren, und dann drehen. Voila.

		var xz2 = doorpos2middlepos(rotation, segments[INDEX2], room2door)

		finalx = door1x + xz2[0];
		finaly = door1y + xz2[1];

		segments[INDEX2].transx = Math.round(finalx);
		segments[INDEX2].transy = Math.round(finaly);
		segments[INDEX2].rot = rotation;

	}

	//daaas hier ist die funktion die von der direkt hierdr�ber ^ gecallt wird, und diese hier will noch nicht wirklich. Maan denkfehler do.
	function doorpos2middlepos(rotation,segment,door){

		//gegeben: Position wo sp�ter die T�r sein soll. gesucht: Position wo der MP hinsoll.
		//von door zu MP ist einfach -die koordinaten der t�r

		alert(door[2]+"    "+rotation);

		var door2x = parseFloat(door[2].slice(1,door[2].indexOf(',')));
		var door2y = parseFloat(door[2].slice(door[2].indexOf(',')+1,door[2].indexOf(')')));

		door2x = door2x*SKALIERUNGSFAKTOR*-1;
		door2y = door2y*SKALIERUNGSFAKTOR*-1;

		//so. w�rden wir jetzt den anderen raum an door1x, door1y packen, h�tte es dort seinen mittelpunkt.
		//Aber, es soll ja dort nicht seinen Mittelpunkt haben, sondern dort soll room2door liegen.
		//f�r rechts unten hei�t das, erst die koordinaten von mittelpunkt zu t�r addieren, und dann drehen. Voila.

		var xz2 = doorpos2middlepos(rotation, segments[INDEX2], room2door)

		finalx = door1x + xz2[0];
		finaly = door1y + xz2[1];

		segments[INDEX2].transx = Math.round(finalx);
		segments[INDEX2].transy = Math.round(finaly);
		segments[INDEX2].rot = rotation;

	}

	//daaas hier ist die funktion die von der direkt hierdr�ber ^ gecallt wird, und diese hier will noch nicht wirklich. Maan denkfehler do.
	function doorpos2middlepos(rotation,segment,door){

		//gegeben: Position wo sp�ter die T�r sein soll. gesucht: Position wo der MP hinsoll.
		//von door zu MP ist einfach -die koordinaten der t�r

		alert(door[2]+"    "+rotation);

		var door2x = parseFloat(door[2].slice(1,door[2].indexOf(',')));
		var door2y = parseFloat(door[2].slice(door[2].indexOf(',')+1,door[2].indexOf(')')));

		door2x = door2x*SKALIERUNGSFAKTOR*-1;
		door2y = door2y*SKALIERUNGSFAKTOR*-1;

		for (var j = 0; j <parseInt(rotation); j++) { //rotieren, pro 90� gilt: y <- x & x <- -y
			var tmp = door2x;
			door2x = -door2y;
			door2y = tmp;
		}

		alert(door2x);


		return [door2x,door2y];
	}
