function renderStatus(statusText) {
    document.getElementById('parse-button').onclick = function() {
	alert("foo");
    };
}

document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('parse-button').onclick = function() {
	alert("foo");
	};
}, function(errorMessage) {
      renderStatus(errorMessage);
});

