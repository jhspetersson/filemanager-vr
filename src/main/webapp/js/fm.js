var loaded = false;
var scene = document.querySelector('a-scene');
var $scene = $(scene);
if (scene.hasLoaded) {
    run();
} else {
    scene.addEventListener('loaded', run);
}

var x = 0;
var y = 1;
var z = 0;

var currentDir;

function run () {
    if (!loaded) {
        loaded = true;
    } else {
        return;
    }

    listFiles('');
}

AFRAME.registerComponent('selectable-file', {
    init: function () {
        this.el.addEventListener('mouseenter', function (e) {
            $('.file[color=yellow]').each(function () {
                var $this = $(this);
                var oldColor = $this.attr('data-oldcolor');
                $this.attr('color', oldColor);
            });

            var $this = $(this);

            var currentColor = $this.attr('color');
            if (currentColor !== 'yellow') {
                $this
                    .attr('data-oldcolor', currentColor)
                    .attr('color', 'yellow')
            }
        });

        this.el.addEventListener('mouseleave', function (e) {
            var $this = $(this);

            var oldColor = $this.attr('data-oldcolor');
            $this.attr('color', oldColor);
        });
    }
});

AFRAME.registerComponent('transient-file', {
    init : function () {
        var $this = $(this.el);
        var oldPosition = $this.attr('position');

        $this.addClass('transient');
        $this
            .on('refresh', function () {
                $this.remove();
            })
            .on('grab-end', function () {
                $this.removeClass('transient')

                var newPosition = $(this).attr('position');

                console.log('old pos: ');
                console.log(oldPosition);
                console.log('new pos: ');
                console.log(newPosition);
            })
    }
});

AFRAME.registerComponent('drop-location', {
    init: function () {
        var el = this.el;

        el.addEventListener('dragover-start', function (e) {
            el.setAttribute('material', { wireframe : true });
        });

        el.addEventListener('dragover-end', function (e) {
            el.setAttribute('material', { wireframe : false });
        });

        el.addEventListener('drag-drop', function (e) {
            $.ajax({
                url : '/move',
                data : {
                    source : e.detail.dropped.dataset.path,
                    destination : e.detail.on.dataset.path
                },
                dataType : 'json',
                success : function (data) {
                    if (data.error) {
                        errorMessage(data.error)
                    } else {
                        $(e.detail.dropped).remove();
                    }
                }
            })
        });
    }
});

function listFiles(root) {
    $.ajax({
        url : '/ls',
        dataType : 'json',
        data : {
            root : root
        },
        success : function (data) {
            if (data.error) {
                errorMessage(data.error);
            } else {
                currentDir = root;

                $('.transient').trigger('refresh');

                placeFiles(data.data);
            }
        }
    });
}

var loadImage = function ($box, path, i) {
    setTimeout(function () {
        $box.get(0).setAttribute('material', { shader : "flat", src : "/img?name=" + path });
    }, i * 300);
};

function placeFiles (data) {
    var inRow = Math.ceil(data.length / 5);
    var $scene = $('a-scene');

    for (var i = 0; i < data.length; i++) {
        var name = data[i].name;
        var path = data[i].path;

        var xPos = ( i % inRow ) * 0.25 + x;
        var yPos = ( y + Math.floor( i / inRow ) * 0.2 + 0.3 );
        var zPos = -0.5;

        var isDir = data[i].type && data[i].type === 'dir';
        var color = isDir ? '#ffcc66' : getColor(name);
        var height = 0.15;

        var getScale = function (name) {
            if (name.length < 25) {
                return "0.2 0.2 0.2";
            } else {
                return "0.16 0.16 0.16"
            }
        };

        var getWidth = function (name) {
            if (name.length < 25) {
                return 170;
            } else {
                return 250;
            }
        };

        var getYpos = function (name) {
            if (name.length < 11) {
                return 0.06
            } else if (name.length < 12) {
                return 0.055
            } else if (name.length < 13) {
                return 0.05
            } else if (name.length < 19) {
                return 0.04
            } else if (name.length < 25) {
                return 0.03
            } else if (name.length < 30) {
                return 0.025;
            } else {
                return 0;
            }
        };

        var $box = $("<a-box></a-box>").attr({
            class : "file clickable grabbable",
            color : color,
            depth : "0.15",
            height: height,
            width : "0.15",
            position : xPos + " " + yPos + " " + zPos,
            'selectable-file' : '',
            'data-name' : name,
            'data-type' : data[i].type,
            'data-path' : path,
            'data-size' : data[i].size,
            'data-level' : y
            ,'transient-file' : ''
            ,
            'dynamic-body' : '',
            'collision-filter' : 'collidesWith: none',
            sleepy : '',
            grabbable : '',
            'drag-droppable' : '',
            stretchable : ''
        });

        if (isDir) {
            $box.attr('hoverable', '');
            $box.attr('drop-location', '');
        }

        var opacity = 1.0;

        if (data[i].type === "img") {
            loadImage($box, path, i);
            opacity = 0.4;
        }

        var $label = $('<a-entity class="label" position="-0.085 ' + (getYpos(name) - 0.06) + ' 0.08" scale="' + getScale(name) + '" bmfont-text="text: ' + name + '; width: ' + getWidth(name) + '; align: center; fnt: /fonts/DejaVu-sdf.fnt; fntImage: /fonts/DejaVu-sdf.png; opacity: ' + opacity + '"></a-entity>');

        $box.append($label);
        $scene.append($box);
    }

    updateCollisions();
}

function getColor (fileName) {
    if (fileName.indexOf(".cube.csv") !== -1) {
        return '#66ccff';
    }

    var parts = fileName.split('.');
    switch (parts[parts.length - 1].toLowerCase()) {
        case 'exe':
        case 'sh':
            return '#ffcccc';

        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'bmp':
            return 'lightblue';

        case 'js':
            return 'magenta';

        case 'pdf':
        case 'epub':
        case 'mobi':
        case 'fb2':
            return 'green';

        case 'txt':
        case 'doc':
        case 'docx':
            return '#eeeeee';

        case 'zip':
            return 'brown';

        default:
            return 'silver';
    }
}

function updateCollisions () {
    $('[sphere-collider]').each(function () {
        this.components['sphere-collider'].update();
    });
}

function openImage ($box) {
    $('[data-type="viewer"]').remove();

    var $camera = $('[camera]');
    var $img = $('<a-box></a-box>').attr({
        'data-type': 'viewer',
        class : 'clickable',
        width : 1.6,
        height : 0.9,
        depth : 0.05,
        position : '0 -0.2 -2',
        "asset-on-demand" : "src: /img?name=" + $box.data('path')
    });
    $camera.append($img);
}

$(document).on('click', '.clickable', function () {
    var path = $(this).data('path');
    var type = $(this).data('type');

    switch (type) {
        case "dir":
            listFiles(path);
            break;

        case "img":
            openImage($(this));
            break;

        case "cube":
            openCube(path);
            break;

        case "viewer":
            $(this).remove();
            break;
    }
});

$(document).on('gripdown', function () {
    var $viewer = $('[data-type="viewer"]');
    var viewerOpen = $viewer.length > 0;
    if (viewerOpen) {
        $viewer.remove();
    } else {
        var parentDir = '';
        if (!currentDir.match(/^[a-z]:\\$/i)) {
            parentDir = currentDir.substring(0, currentDir.lastIndexOf('\\') || currentDir.lastIndexOf('/'));
        }

        listFiles(parentDir);
    }
});

function errorMessage (messageText) {
    var text = document.querySelector('#message-text').components['bmfont-text'];
    text.data.text = 'Error';
    text.update();

    var message = $('#message');
    message.attr('visible', true);

    setTimeout(function () {
        var text = document.querySelector('#message-text').components['bmfont-text'];
        text.data.text = messageText;
        text.update();
    }, 1000);

    setTimeout(function () {
        message.attr('visible', false);
    }, 3000);
}

function openCube (path) {
    $.ajax({
        url : '/cube',
        data : {
            name : path
        },
        dataType : 'json',
        success : function (cube) {
            buildCube(cube, parseData(cube));
        }
    });
}

function buildCube (cube, parsed) {
    var itemSize = 0.15;
    var margin = 0.05;
    var width = parsed.xValues.length * ( itemSize + margin ) + margin;
    var height = parsed.yValues.length * ( itemSize + margin ) + margin;
    var depth = parsed.zValues.length * ( itemSize + margin ) + margin;

    var camPos = document.querySelector('[camera]').getAttribute('position');
    var cubePos = {
        x: camPos.x - 0.5,
        y: camPos.y + 0.5,
        z: camPos.z - 0.5
    };
    var position = cubePos.x + ' ' + cubePos.y + ' ' + cubePos.z;

    var $cube = $('<a-box></a-box>').attr({
        class : 'grabbable',
        width : width,
        height : height,
        depth : depth,
        position : position,
        grabbable : '',
        stretchable : '',
        'dynamic-body' : ''
        , sleepy : ''
        , 'collision-filter' : 'collidesWith: none'
    });

    $cube.get(0).setAttribute('material', { wireframe : true, opacity: 0.0001 });
    $cube.get(0).setAttribute('grabbable');

    for (var x = 0; x < parsed.xValues.length; x++) {
        var xx = ( x * ( itemSize + margin ) + 2.5* margin ) - parsed.xValues.length * ( itemSize + margin ) / 2;
        var yy = -height/2;
        var zz = depth * 2;
        var lpos = xx + ' ' + yy + ' ' + zz;

        var $label = $('<a-entity class="label" position="' + lpos + '" rotation="-90 90 0" scale="0.5 0.5 0.5" bmfont-text="text: ' + parsed.xValues[x] + '; align: right; width: 400;  fnt: /fonts/DejaVu-sdf.fnt; fntImage: /fonts/DejaVu-sdf.png;"></a-entity>');
        $cube.append($label);
    }

    for (var y = 0; y < parsed.yValues.length; y++) {
        var xx = -width * 1.5;
        var yy = ( y * ( itemSize + margin ) + 2 * margin) - parsed.yValues.length * ( itemSize + margin ) / 2;
        var zz = depth * 1.5 + margin;
        var lpos = xx + ' ' + yy + ' ' + zz;

        var $label = $('<a-entity class="label" position="' + lpos + '" rotation="0 45 0" scale="0.5 0.5 0.5" bmfont-text="text: ' + parsed.yValues[y] + '; align: right; width: 400;  fnt: /fonts/DejaVu-sdf.fnt; fntImage: /fonts/DejaVu-sdf.png;"></a-entity>');
        $cube.append($label);
    }

    for (var z = 0; z < parsed.zValues.length; z++) {
        var xx = -width * 2;
        var yy = height/2;
        var zz = ( z * ( itemSize + margin ) + 2* margin ) - parsed.zValues.length * ( itemSize + margin) / 2;
        var lpos = xx + ' ' + yy + ' ' + zz;

        var $label = $('<a-entity class="label" position="' + lpos + '" rotation="0 0 0" scale="0.5 0.5 0.5" bmfont-text="text: ' + parsed.zValues[z] + '; align: right; width: 400;  fnt: /fonts/DejaVu-sdf.fnt; fntImage: /fonts/DejaVu-sdf.png;"></a-entity>');
        $cube.append($label);
    }

    for (var x = 0; x < parsed.xValues.length; x++) {
        for (var y = 0; y < parsed.yValues.length; y++) {
            for (var z = 0; z < parsed.zValues.length; z++) {
                var xPos = ( x * ( itemSize + margin ) + 2* margin ) - parsed.xValues.length * ( itemSize + margin ) / 2;
                var yPos = ( y * ( itemSize + margin ) + 2* margin) - parsed.yValues.length * ( itemSize + margin ) / 2;
                var zPos = ( z * ( itemSize + margin ) + 2* margin ) - parsed.zValues.length * ( itemSize + margin) / 2;
                var pos = xPos + ' ' + yPos + ' ' + zPos;

                var $item = $('<a-box></a-box>').attr({
                    width : itemSize,
                    height : itemSize,
                    depth : itemSize,
                    position : pos
                });

                var value = getValue(cube.data, parsed.xValues[x], parsed.yValues[y], parsed.zValues[z]);
                var indexColor = Math.floor(value * 255 / ( parsed.max - parsed.min ));
                var color = 'rgb(' + indexColor + ', 100, 200)';
                $item.get(0).setAttribute('material', { color : color });

                $cube.append($item);
            }
        }
    }

    $scene.append($cube);

    updateCollisions();
}

function getValue (data, x, y, z) {
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] === x && data[i][1] === y && data[i][2] === z) {
            return parseFloat(data[i][3]);
        }
    }
}

function parseData (cube) {
    function contains (arr, value) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === value) {
                return true;
            }
        }

        return false;
    }

    var min = parseFloat(cube.data[0][3]);
    var max = parseFloat(cube.data[0][3]);
    var xValues = [];
    var yValues = [];
    var zValues = [];

    for (var i = 0; i < cube.data.length; i++) {
        var record = cube.data[i];
        if (!contains(xValues, record[0])) {
            xValues.push(record[0]);
        }

        if (!contains(yValues, record[1])) {
            yValues.push(record[1]);
        }

        if (!contains(zValues, record[2])) {
            zValues.push(record[2]);
        }

        var value = parseFloat(record[3]);

        if (min > value) {
            min = value;
        } else if (max < value) {
            max = value;
        }
    }

    return {
        min : min,
        max : max,
        xValues : xValues,
        yValues : yValues,
        zValues : zValues
    }
}
