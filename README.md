# CoffeeMap

## Usage

```js
<div id="map"></div>
<script>
var embed_map = new CoffeeMap({
	containerSelector: '#map',
	mapName: 'world'
});
</script>
```

## Constructor options

### `containerSelector` (*String*)

A jQuery DOM selector where to embed the map.

### `baseSVGPath` (*String*)

The URI where to load the SVG maps.

## Dependencies

* *underscore.js*
* *jQuery*

## Credits

Maps SVGs are taken from (http://code.highcharts.com/mapdata/1.0.0/)[http://code.highcharts.com/mapdata/1.0.0]