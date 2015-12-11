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

function clearTags() {
  localStorage["tags"] = "{}";
}

function loadTags(ts) {
  return Object.keys(ts).map(function (t) {
    return {id: t, props: {}, data: ts[t]};
  });
}

var tags = m.prop(loadTags(getTags()));


function addTag(tag) {
  var ts = getTags();
  ts[tag] = {desc: "", goodtill: moment().add(7, 'days'), percentage: 100};
  localStorage["tags"] = JSON.stringify(ts);
  tags(loadTags(ts));
  m.redraw();
}

function hasTag(tag) {
  var ts = getTags();
  return ts.hasOwnProperty(tag);
}


function flashTag(tag) {
  tags(tags().map(function (t) {
    if (t.id === tag) {
      return { id: t.id, highlight: true };
    } else {
      return t;
    }
  }));
  setTimeout(function () {
    tags(tags().map(function (t) {
      if (t.id === tag) {
        return { id: t.id, highlight: false };
      } else {
        return t;
      }
    }));

    m.redraw();
  }, 2000);

  m.redraw();
}

var editing = m.prop(null);

var edit = { desc: m.prop(null), percentage: m.prop(null), goodtill: m.prop(null)};

function edit_tag(id) {
  var ts = getTags();
  var data = ts[id];
  if (typeof data !== "undefined") {
    edit.desc(data.desc);
    edit.percentage(data.percentage);
    edit.goodtill(moment(data.goodtill).format("YYYY-MM-DD"));
    editing(id);
  }
}


var Tags = {
  controller: function () {
    return { };
  },
  edit_view: function (ctrl) {
    if (typeof editing() === "string") {
      return [m("input", {onchange: m.withAttr("value", edit.desc), value: edit.desc()}),
              m("input", {onchange: m.withAttr("value", edit.percentage), value: edit.percentage()}),
              m("input", {onchange: m.withAttr("value", edit.goodtill), value: moment(edit.goodtill()).format("YYYY-MM-DD")}),
              m("button", {onclick: function() {
                var ts = getTags();
                ts[editing()] = {desc: edit.desc(), goodtill: moment(edit.goodtill()), percentage: edit.percentage()};
                localStorage["tags"] = JSON.stringify(ts);
                tags(loadTags(ts));
                editing(null);
              }}, "Save")];
    } else {
      return [];
    }
  },
  view: function(ctrl) {
    return m("div",
             [m(".edit", Tags.edit_view(ctrl)),
               m(".tags", tags().map(function (t) {
                 if (t.id === editing()) {
                   var cl = ".tag.highlight";
                 } else {
                   var cl = ".tag";
                 }
                 return m(cl, { onclick: function () { edit_tag(t.id) } }, t.data.desc + " (" + t.data.percentage + "%) - " + moment(t.data.goodtill).fromNow());
               }))]);
  }
};

var app = {
  initialize: function() {
    this.bindEvents();
    m.mount(document.getElementById("app"), Tags);
  },
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  onDeviceReady: function() {

    nfc.addNdefListener (
      function (nfcEvent) {
        var tag = nfcEvent.tag,
            id = nfc.bytesToHexString(tag.id);

        console.log(id);

        if (hasTag(id)) {
          edit_tag(id);
        } else {
          addTag(id);
          edit_tag(id);
        }
        m.redraw();

      },
      function () {
      },
      function (error) {
        alert("Error adding NDEF listener " + JSON.stringify(error));
      }
    );
  }
};
