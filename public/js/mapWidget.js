/**
 * @desc  a wrapper for leaflet, making things easy.
 * @param mapElement the HTML element or its ID, which will contain the map
 */
function MapWidget(mapElement) {
    
    var _map, _stats, _features, _layers;
    
    /**
     * @desc    add a layer to the map
     * @param   an object literal in GeoJSON format
     * @returns the mapwidget instance, allowing function chaining
     */
    this.addGeoJson = function(data) {
        /* parse the properties of a geojson layer & add them to a popup */
        function _createPopup(properties, layer) {
            var _htmlString = '';
            for (var prop in properties) {
                _htmlString += '<tr><th>' + prop + ':</th><td>' + properties[prop] + '</td></tr>';
            }
            if (_htmlString !== '') layer.bindPopup(('<table>' + _htmlString + '</table>'));
        }
                
        /* add a geojson layer to the map */
        var dataset = L.geoJson(data, {
            onEachFeature: function(feature, layer) {
                if (feature.properties) {
                    _createPopup(feature.properties, layer);
                    _features.push({
                        properties: feature.properties,
                        bounds: layer.getBounds ? layer.getBounds() : layer.getLatLng()
                    });
                }
            }
        });
        
        L.markerClusterGroup().addLayer(dataset).addTo(_layers);
        _map.fitBounds(_layers.getBounds());
        return this;
    };
    
    /* initializes the map on the given HTMLelement */
    function _initialize(HTMLelement) {
        _map      = L.map(HTMLelement, { maxZoom: 15 }).setView([51.96, 7.63], 13);
        _stats    = new MapStatistics(_map); // statistics view
        _layers   = L.featureGroup().addTo(_map);
        _features = []; // contains data & bounds of all vector features for statistics 
        
        var _osmAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
        var _basemaps = {
            OpenStreetMap: L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: _osmAttribution
            }),
            OpenTopoMap: L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
				attribution:
                    'Map data: ' + _osmAttribution + 
                    ', <a href="http://viewfinderpanoramas.org">SRTM</a> | ' +
                    'Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> ' +
                    '(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            }),
            Toner: L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
				attribution:
					'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
					'<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; ' +
					'Map data ' + _osmAttribution
            })
        };
        
        /* add controls */
        L.control.layers(_basemaps, { "Dataset": _layers }, { position: 'topleft'}).addTo(_map);
        L.control.scale().addTo(_map);
        
        _basemaps.OpenStreetMap.addTo(_map);
        
        /* listen for when the map is dragged */
        _map.on('moveend', function(e) {
            /* filter the currently visible features & calculate statistics on them */
            var mapView = _map.getBounds(), data = {};
            
            for(var i = 0; i < _features.length; i++) {
                if (mapView.contains(_features[i].bounds)) {
                    /* push each property to the data object */
                    for(var prop in _features[i].properties) {
                        if ( !(data[prop] instanceof Array) ) data[prop] = [];
                        data[prop].push(_features[i].properties[prop]);
                    }
                }
            }
            
            /* generate statistics */
            _stats.update(data);
        });
    }
    
    _initialize(mapElement || 'map');
    return this;
}


/**
 * @desc  adds an control to the map, which contains statistics
 *        to calculate & view the statistics, call .update(data)
 *        data has to have the format { measure1: [values], measure2: [values], ... }
 * @param map the map object to add the control to
 */
function MapStatistics(map) {
    var _statsview,
        _map = map;
    
    /* takes an data object like { measure1: [values], measure2: [values], ... }
       & calculates statistics on them */
    this.update = function(data) {
        var stats = {};
        for (var prop in data) {
            //stats[prop] = getStatistics(data[prop]);
            //stats[prop] = { median: 34, min: 6 };
        }
        _statsview.update(stats);
        return this;
    };
    
    function _initialize(map) {
        _statsview = L.control();

        _statsview.onAdd = function(map) {
            this._div = L.DomUtil.create('div', 'statsview');
            this.update();
            return this._div;
        };

        _statsview.update = function (results) {
            var htmlString = '';
            for (var prop in results) {
                htmlString += '<tr><th>' + prop
                    + '</th><td>' + results[prop].median + '</td><td>' + results[prop].min
                    + '</td><td>' + results[prop].max    + '</td><td>' + results[prop].quartile1
                    + '</td></tr>';
            }
            this._div.innerHTML = '<h4>Statistics</h4><table><tr><td></td>'
                + '<th>median</th><th>min</th><th>max</th><th>.25qt</th></tr>'
                + htmlString + '</table>';
        };
        
        _statsview.addTo(map);
    }

    _initialize(map);
    return this;
}