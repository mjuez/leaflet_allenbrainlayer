L.AllenBrainLayer = L.TileLayer.extend({

    initialize: function (atlasId, options) {
        this._atlasId = atlasId;
        this._getAtlasSlices(atlasId, (error, data) => {
            if (!error) {
                [slices, maxSize] = data;
                this._slices = slices;
                this._maxDownsample = this._calculateDownsample(maxSize);
                this.options.maxNativeZoom = this._maxDownsample;
                this.options.tileSize = Math.floor(maxSize / Math.pow(2, this._maxDownsample));
                this.redraw();
            }
        });
    },

    getTileUrl: function (coords) {
        if (this._slices) {
            var slice = this._slices[1]; // temporal
            var size = this.options.tileSize;

            var currentZoom = this._tileZoom;
            var downsample = 0;
            if (currentZoom < this._maxDownsample) {
                downsample = this._maxDownsample - currentZoom;
            }
            var url = slice.downsample(downsample).tile(coords, size).url;
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
            return {
                id: data.id,
                width: data.width,
                height: data.height,
                url: data.url || `http://api.brain-map.org/api/v2/image_download/${data.id}?`,
                downsample: function (downsample) {
                    var data = {
                        id: this.id,
                        width: this.width,
                        height: this.height
                    }
                    var downsampledSlice = createSlice(data);
                    if (downsample > 0) {
                        downsampledSlice.width = Math.floor(downsampledSlice.width / Math.pow(2, downsample));
                        downsampledSlice.height = Math.floor(downsampledSlice.height / Math.pow(2, downsample));
                        downsampledSlice.url += `downsample=${downsample}&`;
                    }
                    return downsampledSlice;
                },
                tile: function (coords, size) {
                    var data = {
                        id: this.id,
                        width: this.width,
                        height: this.height,
                        url: this.url
                    }
                    var sliceTile = createSlice(data);
                    var left = coords.x * size;
                    var top = coords.y * size;
                    var remainingWidth = this.width - left;
                    var remainingHeight = this.height - top;
                    sliceTile.width = size;
                    sliceTile.height = size;
                    if (size > remainingWidth) {
                        sliceTile.width = remainingWidth;
                    }
                    if (size > remainingHeight) {
                        sliceTile.height = remainingHeight;
                    }
                    sliceTile.url += `left=${left}&top=${top}&width=${sliceTile.width}&height=${sliceTile.height}`;
                    return sliceTile;
                }
            }
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
                var [slices, maxSize] = atlasImages.reduce(getSliceInformation, [{}, 0]);
                callback(null, [slices, maxSize]);
            } else {
                callback("Error processing http request.", null);
            }
        }

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", `http://api.brain-map.org/api/v2/data/query.json?criteria= model::Atlas, rma::criteria,[id$eq${atlasId}], rma::include,atlas_data_sets(atlas_images(treatments))`, true); // false for synchronous request
        xmlHttp.send(null);
        xmlHttp.onreadystatechange = onRequestReady;
    },

    _calculateDownsample: function (maxSize) {
        var MAX_TILE_SIZE = 256;
        var currentSize = maxSize;
        var downsample = 0;
        while (currentSize > MAX_TILE_SIZE) {
            currentSize /= 2;
            downsample++;
        }
        return downsample;
    }
});

L.allenBrainLayer = function (atlasId, options) {
    return new L.AllenBrainLayer(atlasId, options);
}