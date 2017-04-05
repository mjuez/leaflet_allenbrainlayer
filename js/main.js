/** main functions. */
$(document).ready(main);

function main() {
    var allenBrainMap = L.map('allen-brain-map').setView([51.505, -0.09], 13);
    L.allenBrainLayer(1, {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.satellite',
        accessToken: 'pk.eyJ1IjoibWp1ZXp1cG0iLCJhIjoiY2oweHV3ZnZmMDAxbTJ3cGdpczFsZHl2bCJ9.bpamxyE69xc1D0m8zwqGPA'
    }).addTo(allenBrainMap);
}