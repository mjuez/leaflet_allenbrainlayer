L.AllenBrainLayer = L.TileLayer.extend({

    initialize: function (atlasId, options) {
        this._fetchSliceUrls(atlasId, (error, slicesInformation) => {
            this._slices = slicesInformation;
        });
    },

    getTileUrl: function (coords) {
        if (this._slices) {
            var url = `http://api.brain-map.org/api/v2/image_download/${this._slices[1].id}?downsample=5`;
            console.log(url);
            return url;
        }
        console.log("no slices");
        return null;
        //var i = Math.ceil(Math.random() * 4);
        //return "http://placekitten.com/256/256?image=" + i;
    },

    getAttribution: function () {
        return "<a href='http://brain-map.org'>Allen Brain Atlas</a>"
    },

    _fetchSliceUrls: function (atlasId, callback) {
        var getSliceInformation = function (slices, atlasImage) {
            slices[atlasImage.section_number] = {
                id: atlasImage.id,
                width: atlasImage.width,
                height: atlasImage.height
            };
            return slices;
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
                var slicesInformation = atlasImages.reduce(getSliceInformation, {});
                callback(null, slicesInformation);
            } else {
                callback("Error processing http request.", null);
            }
        }

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", `http://api.brain-map.org/api/v2/data/query.json?criteria= model::Atlas, rma::criteria,[id$eq${atlasId}], rma::include,atlas_data_sets(atlas_images(treatments))`, true); // false for synchronous request
        xmlHttp.send(null);
        xmlHttp.onreadystatechange = onRequestReady;
    }
});

L.allenBrainLayer = function (atlasId, options) {
    return new L.AllenBrainLayer(atlasId, options);
}