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

function tagSeen(tag) {
  if (hasTag(id)) {
    edit_tag(id);
  } else {
    addTag(id);
    edit_tag(id);
  }
  m.redraw();
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

function compare_times(a,b) {
  if (moment(a.data.goodtill).isBefore(b.data.goodtill)) {
    return -1;
  } else if (moment(a.data.goodtill).isSame(b.data.goodtill)) {
    return 0;
  } else {
    return 1;
  }
}

var pikaday = function (date) {
  return function (el, isInitialized) {
    if (isInitialized) {
      return;
    }

    // Everything here is Pikaday-related...
    var input = document.createElement('input');
    input.className = "form-control";

    if (Date.parse(date()) === NaN) {
      var current = null;
    } else {
      var current = new Date(date());
    }

    function setValue() {
      if (current) {
        input.value = current.getFullYear() + "/" + (current.getMonth() + 1) + "/" + current.getDate();
      }
    }

    setValue();

    el.appendChild(input);

    new Pikaday({defaultDate: current,
                 field: input,
                 onSelect: function () {
	           // Except here, where we bind Pikaday's events back to the Mithril model
	           date(this.getDate().toISOString());
                   current = this.getDate();
                   setValue();
                   m.redraw();
                 }
                });
  }
};

var Tags = {
  controller: function () {
    return { };
  },
  edit_view: function (ctrl) {
    if (typeof editing() === "string") {
      return [m(".form",
                [m(".row",[m("span", "desc"),
                           m(".field", m("input", {onchange: m.withAttr("value", edit.desc), value: edit.desc()}))]),
                 m(".row",[m("span", "good for"),
                           m(".field",
                             [[0, 1, "bad"], [1, 3, "1 day"],[3, 5, "3 days"],[5, 7, "5 days"], [7, 14, "1 week"], [14, 21, "2 weeks"],
                              [21, 31, "3 weeks"], [31, 61, "1 month"], [61, 92, "2 months"], [92, 300, "3 months"]].map(function(e) {
                                if (moment(edit.goodtill()).isBetween(moment().add(e[0], 'days'), moment().add(e[1], 'days'))) {
                                  var cls = "active";
                                } else {
                                  var cls = "";
                                }
                                return m("button", {class: cls, onclick: function () {
                                  edit.goodtill(moment().add(e[0], 'days').add(10, 'minutes'));
                                }}, e[2]);
                              }))]),
                 m(".row", [m("span", "amount left"),
                            m(".field",
                              [0,10,20,30,40,50,60,70,80,90,100].map(function(e) {
                                if (edit.percentage() >= e) {
                                  var cls = "active";
                                } else {
                                  var cls = "";
                                }
                                return m("button", {class: cls, onclick: function () {
                                  edit.percentage(e);
                                }}, "");
                              }))]),
                 m(".row",
                   m("button", {onclick: function() {
                     var ts = getTags();
                     ts[editing()] = {desc: edit.desc(), goodtill: moment(edit.goodtill()), percentage: edit.percentage()};
                     localStorage["tags"] = JSON.stringify(ts);
                     tags(loadTags(ts));
                     editing(null);
                   }}, "Save"))]),
              m(".exit",
                m("button", {onclick: function() {
                  editing(null);
                }}, "X"))];
    } else {
      return [];
    }
  },
  view: function(ctrl) {
    if (editing() !== null) {
      return m(".edit", Tags.edit_view(ctrl))
    } else {
      return m(".tags", tags().sort(compare_times).map(function (t) {
        if (t.id === editing()) {
          var cl = ".tag.highlight";
        } else {
          var cl = ".tag";
        }
        if (moment().isAfter(moment(t.data.goodtill))) {
          cl = cl + ".expired";
        } else if (moment().add(3, 'days').isAfter(t.data.goodtill)) {
          cl = cl + ".expiring";
        }
        return m(cl, { onclick: function () { edit_tag(t.id) } }, t.data.desc + " (" + t.data.percentage + "%) - " + moment(t.data.goodtill).fromNow());
      }));
    }
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

    // NOTE(dbp 2015-12-13): To facilitate testing off-device, only add event handlers if nfc present

    if (typeof nfc !== "undefined") {
      nfc.addNdefListener (
        function (nfcEvent) {
          var tag = nfcEvent.tag,
              id = nfc.bytesToHexString(tag.id);

          tagSeen(id);
        },
        function () {
        },
        function (error) {
          alert("Error adding NDEF listener " + JSON.stringify(error));
        }
      );
    }
  }
};
