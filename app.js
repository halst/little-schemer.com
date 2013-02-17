// Generated by CoffeeScript 1.4.0
(function() {
  var editor, elements, run;

  editor = CodeMirror.fromTextArea(document.getElementById('code'), {
    lineNumbers: false,
    mode: 'scheme',
    keyMap: location.hash === '#vi' ? 'vim' : 'default',
    lineWrapping: true,
    autofocus: true,
    showCursorWhenSelecting: true,
    matchBrackets: true
  });

  window.editor = editor;

  elements = [];

  run = function(editor) {
    var results;
    results = little["eval"](editor.getValue().trimRight());
    return results.forEach(function(_arg) {
      var color, element, line, result;
      line = _arg.line, result = _arg.result;
      element = document.createElement('span');
      color = result.match(/^error/) ? 'brown' : 'green';
      element.style.color = color;
      element.style.textShadow = "0px 0px 70px " + color;
      element.innerText = result;
      element.innerHTML = '&nbsp;&rArr; ' + element.innerHTML;
      editor.addWidget({
        line: line,
        ch: 1000
      }, element);
      return elements.push(element);
    });
  };

  CodeMirror.keyMap["default"]['Shift-Enter'] = run;

  CodeMirror.keyMap.vim['Shift-Enter'] = run;

  editor.on('change', function(editor, change) {
    return elements.forEach(function(element) {
      return element.style.left = '-100000px';
    });
  });

  run(editor);

}).call(this);