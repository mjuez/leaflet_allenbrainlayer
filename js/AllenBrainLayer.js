L.AllenBrainLayer = L.GridLayer.extend({

    initialize: function (atlasId, options) {
        this._atlasId = atlasId;
        L.Util.setOptions(this, options);
        this._getAtlasSlices(atlasId, (error, slices) => {
            if (!error) {
                this._slices = slices;
                this.setSlice(200);
            }
        });
    },

    createTile: function (coords) {
        var tile = document.createElement('img');
        if(this._slices){
            tile.src = this._slice.getTileUrl(coords);
        }
        return tile;
    },

    /*getTileUrl: function (coords) {
        if (this._slices) {
            return this._slice.getTileUrl(coords);
        }
        return null;
    },*/

    getAttribution: function () {
        return "<a href='http://brain-map.org'>Allen Brain Atlas</a>"
    },

    setSlice: function (numSlice) {
        this._slice = this._slices[numSlice];
        this.options.maxNativeZoom = this._slice.maxDownsample;
        this.options.minNativeZoom = 0;
        this.options.tileSize = this._slice.tileSize;
        this.redraw();
    },

    _getAtlasSlices: function (atlasId, callback) {
        var createSlice = function (data) {

            var getDownsample = function (zoom, maxDownsample) {
                var downsample = 0;
                if (zoom < maxDownsample) {
                    downsample = maxDownsample - zoom;
                }
                return downsample;
            }

            var getAxisDivisions = function (downsample, maxDownsample) {
                var numTiles = Math.pow(2, maxDownsample - downsample);
                return numTiles;
            }

            var calculateMaxDownsample = function (size, maxSize = 256, maxDownsample = 0) {
                if (size <= maxSize) {
                    return maxDownsample;
                }
                return calculateMaxDownsample(size / 2, maxSize, maxDownsample + 1);
            }

            var calculateTileSize = function (width, height, downsample) {
                var downsampledWidth = Math.floor(width / Math.pow(2, downsample));
                var downsampledHeight = Math.floor(height / Math.pow(2, downsample));
                return L.point(downsampledWidth, downsampledHeight);
            }

            var maxSize = Math.max(data.width, data.height);
            var maxDownsample = calculateMaxDownsample(maxSize);
            var tileSize = calculateTileSize(data.width, data.height, maxDownsample);

            var slice = {
                coords_axis: [data.x, data.y],
                width: data.width,
                height: data.height,
                maxDownsample: maxDownsample,
                tileSize: tileSize,
                url: `http://api.brain-map.org/api/v2/image_download/${data.id}?`,
                getTileUrl: function (coords) {
                    var zoom = coords.z;
                    var downsample = getDownsample(zoom, slice.maxDownsample);
                    var axisDivisions = getAxisDivisions(downsample, slice.maxDownsample);
                    var originalTileWidth = Math.floor(slice.width / axisDivisions);
                    var originalTileHeight = Math.floor(slice.height / axisDivisions);
                    var x = (originalTileWidth * coords.x) + slice.coords_axis[0];
                    var y = (originalTileHeight * coords.y) + slice.coords_axis[1];
                    return `${slice.url}top=${y}&left=${x}&width=${originalTileWidth}&height=${originalTileHeight}&downsample=${downsample}`;
                }
            };

            return slice;
        }



        var getSliceInformation = function ([slices, maxSize], atlasImage) {
            slices[atlasImage.section_number] = createSlice(atlasImage);

            if (atlasImage.width > maxSize) {
                maxSize = atlasImage.width;
            }

            if (atlasImage.height > maxSize) {
                maxSize = atlasImage.height;
            }

            return [slices, maxSize];
        }

        var onRequestReady = function (event) {
            var request = event.currentTarget;
            var STATE_DONE = 4;
            var STATUS_OK = 200;

            if (request.readyState === STATE_DONE && request.status === STATUS_OK) {
                var jsonData = JSON.parse(request.responseText);
                var msg = jsonData.msg[0];
                var atlasDataSets = msg.atlas_data_sets[0];
                var atlasImages = atlasDataSets.atlas_images;
                [slices, maxSize] = atlasImages.reduce(getSliceInformation, [{}, 0]);
                callback(null, slices);
            } else {
                callback("Error processing http request.", null);
            }
        }

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", `http://api.brain-map.org/api/v2/data/query.json?criteria= model::Atlas, rma::criteria,[id$eq${atlasId}], rma::include,atlas_data_sets(atlas_images(treatments))`, true); // false for synchronous request
        xmlHttp.send(null);
        xmlHttp.onreadystatechange = onRequestReady;
    },
});

L.allenBrainLayer = function (atlasId, options) {
    return new L.AllenBrainLayer(atlasId, options);
}