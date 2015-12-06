function getTags() {
  try {
    var tags = JSON.parse(localStorage["tags"]);
  } catch (_) {
    localStorage["tags"] = JSON.stringify({});
    tags = {};
  } finally {
    return tags;
  }
}

function addTag(tag) {
  var tags = getTags();
  tags[tag] = 1;
  localStorage["tags"] = JSON.stringify(tags);
}

function hasTag(tag) {
  var tags = getTags();
  return tags.hasOwnProperty(tag);
}

function createDom() {
  var holder = document.getElementById("tags");
  var fc = holder.firstChild;

  while (fc) {
    holder.removeChild(fc);
    fc = holder.firstChild;
  }

  var tags = getTags();

  Object.keys(tags).sort().forEach(function (tag) {
    var p = document.createElement("p");
    p.className = "tag-" + tag;
    p.innerHTML = tag;
    holder.appendChild(p);
  });
}

function flashTag(tag) {
  var holder = document.getElementById("tags");
  var elt = holder.querySelector(".tag-" + tag);
  elt.setAttribute('style', "background-color: orange");
  setTimeout(function () { elt.setAttribute('style', "background-color: transparent;"); }, 2000);
}


var app = {
  initialize: function() {
    this.bindEvents();
  },
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  onDeviceReady: function() {
    app.receivedEvent('deviceready');

    createDom();

    nfc.addNdefListener (
      function (nfcEvent) {
        var tag = nfcEvent.tag,
            id = nfc.bytesToHexString(tag.id);

        console.log(id);

        if (hasTag(id)) {
          flashTag(id);
        } else {
          addTag(id);
          createDom();
        }

      },
      function () {
      },
      function (error) {
        alert("Error adding NDEF listener " + JSON.stringify(error));
      }
    );
  },
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
  }
};
