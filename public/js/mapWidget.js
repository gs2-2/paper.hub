/**
 * @desc a wrapper for leaflet, making things easy.
 */

function MapWidget(mapElement) {
    
    var _map, _layers = L.featureGroup();
    
    /**
     * @desc    add a layer to the map. accepts GeoJSON and geotagged png images
     * @param   an object literal in GeoJSON format or { data: "imageURL//base64", bounds: L.LatLngBounds }
     * @param   String, defining the type of data in 'data': "GeoJSON" or "raster"
     * @returns the mapwidget instance, for function chaining
     */
    this.addLayer = function(data, dataType) {
        
        /* parse the properties of a geojson layer & add them to a popup */
        function _createPopup(properties, layer) {
            var _htmlString = '';
            for (var prop in properties) {
                _htmlString += '<tr><th>' + prop + ':</th><td>' + properties[prop] + '</td>/</tr>';
            }
            if (_htmlString !== '') layer.bindPopup(('<table>' + _htmlString + '</table>'));
        }
        
        /* add a geojson layer to the map */
        if (dataType === 'GeoJSON') {
            L.geoJson(data, {
                pointToLayer: function(layer, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 8, fillColor: "#f30", color: "#000",
                        weight: 2, opacity: 1, fillOpacity: 0.3
                    });
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties) _createPopup(feature.properties, layer);
                }
            }).addTo(_layers);
            _map.fitBounds(_layers.getBounds());
        }
        
        /* add a raster image to the map */
        else if (dataType === 'raster') {
            L.imageOverlay(data.image, data.bounds).addTo(_layers);
            _map.fitBounds(data.bounds);
        }
        
        return this;
    };
    
    function _initialize(HTMLelement) {
        _map = L.map(HTMLelement).setView([51.96, 7.63], 13);
        
        var _osmAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
        var _basemaps = {
            OpenStreetMap: L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: _osmAttribution
            }),
            OpenTopoMap: L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
				maxZoom: 16,
				attribution:
                    'Map data: ' + _osmAttribution + 
                    ', <a href="http://viewfinderpanoramas.org">SRTM</a> | ' +
                    'Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> ' +
                    '(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            }),
            Toner: L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
				maxZoom: 16,
				attribution:
					'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
					'<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; ' +
					'Map data ' + _osmAttribution
            })
        };
        
        /* add controls */
        L.control.layers(_basemaps, { "Dataset": _layers }).addTo(_map);
        L.control.scale().addTo(_map);
        
        _basemaps.OpenStreetMap.addTo(_map);
        _layers.addTo(_map);
        
        /* listen for when the map is dragged */
        _map.on('moveend', function(e) {
            // TODO: find layers in current view & calculate statistics about their values
            // include & use Jan's function for statistics?
        });
    }
    
    _initialize(mapElement || 'map');
    return this;
}