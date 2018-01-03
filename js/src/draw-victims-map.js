import * as L from "leaflet";
import "leaflet-providers";
import getTribColor from './getTribColors.js';

String.prototype.toTitleCase = function(){
	// returns string in title case (lower, except for first char)
	let retval = this.toLowerCase();
	retval = retval[0].toUpperCase() + retval.slice(1);
	return retval;
}

function useThisVictim(v){
	// Validate each vic for use on the map. Right now, we just need to confirm coordiantes.
	if (v.OCC_LAT != undefined && v.OCC_LNG != undefined) return true;
	// console.log(v, " is false");
	return false
}

function generateVictimPopup(v){
	let retval="";
	if (v.NAME) retval += `<p><strong>${v.NAME}</strong></p>`;
	if (v.AGE) retval += `<p>Age: ${v.AGE}</p>`;
	if (v.RACE) retval += `<p>Race: ${v.RACE.toTitleCase()}</p>`;

	return retval;
}

function getVictimIcon(v){
	// Return the desired style for the icon
	// At present, there is no conditional styling, 
	// but we're requiring the v object just in case.

	return {
		stroke: false,
		fill: true,
		fillColor: getTribColor('trib-red2'),
		fillOpacity: .7,
		radius: 5
	};
}


function restyleVictimMarkers(victimMarkers, o=1, r=5){	
	victimMarkers.eachLayer( l => {
		l.setStyle({
			fillOpacity:o,
			radius: r
		});
	});	
}
module.exports = function drawVictimsMap(container, data){
	// draw the map.
	console.log(data)

	let map = L.map(container,
		{
			zoom: 10,
			center: [41.862013, -87.680716],
			scrollWheelZoom: false,
			minZoom: 10,
			maxZoom: 16,
		    renderer: L.canvas({padding:.05}), // You'll thank me for this when we start plotting dots
			maxBounds:L.latLngBounds([42.029693, -87.969885],[41.603010, -87.466239]) // Limit map to, roughly, the Cook County boundary. No getting lost on the map here.
		}
	);

	L.tileLayer.provider('OpenStreetMap.BlackAndWhite').addTo(map);

	// ADDS CITY MASK
	L.tileLayer( "http://media.apps.chicagotribune.com/maptiles/chicago-mask/{z}/{x}/{y}.png", { 
		maxZoom: 16, 
		minZoom: 10, 
		opacity: 0.5 
	}).addTo(map);

	let victimMarkers = L.layerGroup({});

	data.forEach(v => {
		// V FOR VICTIM
		if (useThisVictim(v)){

			//customPopup goes here
			var customPopup = generateVictimPopup(v);

			const vMarker = L.circleMarker({
				lat:parseFloat(v.OCC_LAT),
				lng:parseFloat(v.OCC_LNG)
			}, getVictimIcon(v))
			.bindPopup(customPopup);
	
			vMarker.addTo(victimMarkers);
		}
	});

	victimMarkers.addTo(map);

	// We want to tweak the style of the markers. By default they are small 
	// and mostly transparent, but as the map zooms in, we want them to be 
	// bigger/bolder/more visible.

	map.on('zoomend', e => {
		const currentZoom = map.getZoom();
		if (currentZoom >= 14){
			// all the way in
			restyleVictimMarkers(victimMarkers, .9, 14)
		} else if (currentZoom >= 12){
			// getting closer
			restyleVictimMarkers(victimMarkers, .6, 12)
		} else {
			// default
			restyleVictimMarkers(victimMarkers, .55, 6)
		}
	});

}