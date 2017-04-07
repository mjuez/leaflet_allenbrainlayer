L.AllenBrainLayer = L.TileLayer.extend({

    initialize: function (atlasId, options) {
        this._atlasId = atlasId;
        this._getAtlasSlices(atlasId, (error, data) => {
            if (!error) {
                [slices, maxDownsample] = data;
                this._slices = slices;
                this.options.maxNativeZoom = maxDownsample;
                this.redraw();
            }
        });
    },

    getTileUrl: function (coords) {
        if (this._slices) {
            var slice = this._slices[200]; // temporal
            var url = slice.getTileUrl(coords);
            console.log(url);
            return url;
        }
        return null;
    },

    getAttribution: function () {
        return "<a href='http://brain-map.org'>Allen Brain Atlas</a>"
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
                return Math.sqrt(numTiles);
            }

            var slice = {
                coords_axis: [data.x, data.y],
                base_width: data.width,
                base_height: data.height,
                url: `http://api.brain-map.org/api/v2/image_download/${data.id}?`,
                adjust: function (size, maxDownsample) {
                    [x, y] = slice.coords_axis;
                    var xOffset = Math.floor((size - slice.base_width) / 2); // not sure
                    var yOffset = Math.floor((size - slice.base_height) / 2); // not sure
                    slice.coords_axis = [x - xOffset, y - yOffset];
                    slice.size = size;
                    slice.maxDownsample = maxDownsample;
                    return slice;
                },
                getTileUrl: function (coords) {
                    var zoom = coords.z;
                    var downsample = getDownsample(zoom, slice.maxDownsample);
                    var axisDivisions = getAxisDivisions(downsample, slice.maxDownsample);
                    var originalTileSize = Math.floor(slice.size / axisDivisions);
                    var x = (originalTileSize * coords.x) + slice.coords_axis[0];
                    var y = (originalTileSize * coords.y) + slice.coords_axis[1];
                    return `${slice.url}top=${y}&left=${x}&width=${originalTileSize}&height=${originalTileSize}&downsample=${downsample}`;
                }
            };

            return slice;

        var getAdjustedSizeAndDownsample = function (size, currentSize = 256, downsample = 0) {
            console.log(currentSize);
            if (currentSize >= size) {
                return [currentSize, downsample];
            }
            return getAdjustedSizeAndDownsample(size, currentSize * 2, downsample + 1);
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

        var calculateMaxDownsample = function (size) {
            var TILE_SIZE = 256;
            var currentSize = maxSize;
            var downsample = 0;
            while (currentSize > TILE_SIZE) {
                currentSize /= 2;
                downsample++;
            }
            return downsample;
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
                [adjustedMaxSize, maxDownsample] = getAdjustedSizeAndDownsample(maxSize);
                console.log(`adjusted size: ${adjustedMaxSize}, max downsample: ${maxDownsample}`);
                //var maxDownsample = calculateMaxDownsample(adjustedMaxSize);
                Object.keys(slices).map((key) => slices[key].adjust(adjustedMaxSize, maxDownsample));
                callback(null, [slices, maxDownsample]);
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