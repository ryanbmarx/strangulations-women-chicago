import drawVictimsMap from './draw-victims-map.js'

window.addEventListener('load', function(e){
	drawVictimsMap(document.querySelector('#map'), window.victims);

})