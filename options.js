function save_options() {
    var username = document.getElementById('username').value;
    
    chrome.storage.sync.set(
        {
            username : username
        }, function() {
            var status = document.getElementById('status');
            status.textContent = "Options saved";
            setTimeout(function() {
                status.textContent = '';
                window.close();
            }, 750);
        });
}

function restore_options() {
    chrome.storage.sync.get({
        username : 'i2e'
    }, function(items) {
        document.getElementById('username').value = items.username;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
