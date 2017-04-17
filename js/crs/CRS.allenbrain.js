L.CRS.allenbrain = function (size) {
    return L.Util.extend({}, L.CRS.EPSG3857, {
        scale: function (zoom) {
            return size * Math.pow(2, zoom);
        },

        zoom: function (scale) {
            return Math.log(scale / size) / Math.LN2;
        },
    });
}