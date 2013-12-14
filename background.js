chrome.app.runtime.onLaunched.addListener(function() {
  /*var w = chrome.appWindow || chrome.app.window;
  w.create('main.html', {
    frame: 'chrome',
    width: 440,
    minWidth: 440,
    minHeight: 200,
  });*/
  window.open('main.html');
});
