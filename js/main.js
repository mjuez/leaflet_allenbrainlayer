/** main functions. */
$(document).ready(main);

var layer;

function main() {
    var allenBrainMap = L.map('allen-brain-map').setView([0,0], 0);
    layer = L.allenBrainLayer(1, {
        maxZoom: 10,
        zoom: 5
    });
    layer.addTo(allenBrainMap);
}