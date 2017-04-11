const unirest = require('unirest');
const request = require('request');
const fs = require('fs');
const path = require('path');

unirest.get(`http://api.brain-map.org/api/v2/data/query.json?criteria= model::Atlas, rma::criteria,[id$eq1], rma::include,atlas_data_sets(atlas_images(treatments))`)
    .headers({ 'Accept': 'application/json', 'Content-Type': 'application/json' })
    .end(function (response) {
        let jsonresponse = response.body;
        let images = {};
        jsonresponse.msg[0].atlas_data_sets[0].atlas_images.map((atlas_image) => {
            images[atlas_image.section_number] = atlas_image.id;
        });
        Object.keys(images).map((key) => {
            let image_url = `http://api.brain-map.org/api/v2/image_download/${images[key]}`;
            console.log(image_url);

            request.get(image_url).on('response', (res) => {
                if (res.statusCode === 200) {
                    try {
                        res.pipe(fs.createWriteStream(path.join(__dirname, 'img', `${key}.jpg`)));
                    } catch (error) {
                        console.log(error);
                    }
                }
            });

        });
    });