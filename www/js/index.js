function getWords() {
  try {
    var words = JSON.parse(localStorage["words"]);
  } catch (_) {
    localStorage["words"] = JSON.stringify({});
    words = {};
  } finally {
    return words;
  }
}

function orderedWords(match) {
  var words = getWords();
  var arrs = Object.keys(words).filter(function(w) {
    if (typeof match === "undefined") {
      return true;
    } else if (w === match) {
      return false;
    } else {
      return w.indexOf(match) !== -1;
    }
  }).map(function(w) {
    return [w, words[w]];
  });
  return arrs.sort(function (a,b) {
    if (a[1] > b[1]) {
      return -1;
    } else if (a[1] < b[1]) {
      return 1;
    } else {
      return 0;
    }
  }).map(function (p) { return p[0]; });
}

function modWords(sentance, n) {
  var words = getWords();
  sentance.replace(".", "").replace(",","").split(" ").map(function(w) {
    var word = w.toLowerCase();
    if (typeof words[word] === "undefined") {
      words[word] = n;
    } else {
      words[word] = words[word] + n;
    }
    if (words[word] <= 0) {
      delete words[word];
    }
  });
  localStorage["words"] = JSON.stringify(words);
}

var addWords = function(sentance) { modWords(sentance, 1); };
var removeWords = function(sentance) { modWords(sentance, -1); };

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

function deleteTag(tag) {
  var ts = getTags();
  delete ts[tag];
  localStorage["tags"] = JSON.stringify(ts);
  tags(loadTags(ts));
  m.redraw();
}

function hasTag(tag) {
  var ts = getTags();
  return ts.hasOwnProperty(tag);
}

function tagSeen(tag) {
  if (hasTag(tag)) {
    edit_tag(tag);
  } else {
    addTag(tag);
    edit_tag(tag);
  }
  m.redraw();
}

var editing = m.prop(null);

var descing = m.prop(null);

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

function save() {
  var ts = getTags();
  var old = ts[editing()];
  ts[editing()] = {desc: edit.desc(), goodtill: moment(edit.goodtill()), percentage: edit.percentage()};
  removeWords(old.desc);
  addWords(edit.desc());
  localStorage["tags"] = JSON.stringify(ts);
  tags(loadTags(ts));
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

var Tags = {
  controller: function () {
    return { };
  },
  edit_view: function (ctrl) {
    if (typeof editing() === "string") {
      if (descing() !== null) {
        var desc_options = m(".row",
                             [m("span", ""),
                              m(".field", orderedWords(descing()).map(function(w) {
                                return m(".button", {onclick: function() {
                                  if (/ $/.test(edit.desc()) || edit.desc() === "") {
                                    edit.desc(edit.desc() + w);
                                  } else {
                                    var before = edit.desc().split(" ").slice(0,-1).join(" ");
                                    if (before !== "") {
                                      before = before + " ";
                                    }
                                    edit.desc(before + w);
                                  }
                                  save();
                                  document.getElementById("description").focus();
                                }}, w);
                              }))]);
      } else {
        var desc_options = [];
      }
      return [m(".form",
                [m(".row",[m("span", "desc"),
                           m(".field", m("input", {
                             autocomplete: "off",
                             autocorrect: "off",
                             autocapitalize: "off",
                             spellcheck: "false",
                             onclick: function(e) {
                               e.stopPropagation();
                             },
                             onfocus: function () {
                               descing("");
                             },
                             onkeyup: function (e) {
                               var v = e.target.value.toLowerCase();
                               console.log(v);
                               edit.desc(v);
                               if (v[v.length - 1] !== ' ') {
                                 var a = v.split(" ").slice(-1)[0];
                                 descing(a);
                               } else {
                                 descing("");
                               }
                               save();
                             }, value: edit.desc()})),
                           desc_options]),
                 m(".row",[m("span", "good for"),
                           m(".field",
                             [[-1000, 1, "it's bad", "bad"], [1, 3, "1 day"],[3, 5, "3 days"],[5, 7, "5 days"], [7, 14, "1 week"], [14, 21, "2 weeks"],
                              [21, 31, "3 weeks"], [31, 61, "1 month"], [61, 92, "2 months"], [92, 182, "3 months"], [182, 365, "6 months"], [365, 900, "1 year"]].map(function(e) {
                                if (moment(edit.goodtill()).isBetween(moment().add(e[0], 'days'), moment().add(e[1], 'days'))) {
                                  var cls = "active";
                                } else {
                                  var cls = "";
                                }
                                if (e[3]) {
                                  cls = cls + " " + e[3];
                                }
                                return m(".button", {class: cls, onclick: function () {
                                  edit.goodtill(moment().add(e[0], 'days').add(10, 'minutes'));
                                  save();
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
                                return m(".bar", {class: cls, onclick: function () {
                                  edit.percentage(e);
                                  save();
                                }}, "");
                              }))]),
                 m(".row", [m("span", "delete"),
                            m(".field",
                              m("button.delete", { onclick: function () {
                                deleteTag(editing());
                                editing(null);
                              }}, "THIS ITEM IS USED UP"))])
                ]),
              m(".exit",
                m("span", {onclick: function() {
                  editing(null);
                  descing(null);
                }}, "X"))];
    } else {
      return [];
    }
  },
  view: function(ctrl) {
    if (editing() !== null) {
      if (moment().isAfter(moment(edit.goodtill()))) {
        var date_cls = ".bad";
      } else if (moment().add(3, 'days').isAfter(edit.goodtill())) {
        var date_cls = ".close";
      } else {
        var date_cls = ".good";
      }
      return m(".edit" + date_cls, {onclick: function () {
        descing(null);
      }}, Tags.edit_view(ctrl))
    } else {
      return m(".tags", tags().sort(compare_times).map(function (t) {
        var cl = ".tag";
        if (moment().isAfter(moment(t.data.goodtill))) {
          cl = cl + ".expired";
          var goodtill = "IT'S BAD";
        } else if (moment().add(3, 'days').isAfter(t.data.goodtill)) {
          cl = cl + ".expiring";
          var goodtill = moment(t.data.goodtill).fromNow(true);
        } else {
          var goodtill = moment(t.data.goodtill).fromNow(true);
        }
        return m(cl, { onclick: function () { edit_tag(t.id) } },
                 [m(".left", [m(".desc", t.data.desc),
                              m(".goodtill", goodtill)]),
                  m(".percentage", [100,90,80,70,60,50,40,30,20,10].map(function(e) {
                    if (t.data.percentage >= e) {
                      return m(".bar.active");
                    } else {
                      return m(".bar");
                    }
                  }))]);
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
