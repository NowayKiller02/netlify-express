window.addEventListener('load', () => {
    // Controleren of service worker bruikbaar zijn in je browser
    if ('serviceWorker' in navigator) {
        this.navigator.serviceWorker.register('./service-worker.js')
            .then(function (registration) {
                console.log('Registration successful: ');
                console.log(registration);

            })
            .catch(function (error) {
                console.log('Service worker registration failed, error:', error);
            });
    }

    var subb = window.localStorage.getItem('subscribed');
    if (subb == null) {
        //code dat een subscription op push notifications aanvraagt
        navigator.serviceWorker.getRegistration().then((registration) => {
            registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array("BOe8_sGgicW6dm8zm2yj9ErTCC0ucs4rgIiXTkpM3QLrRPtijiT4RvPb3f_tQLuS0k6i6zaOTVdE-XWQAsN_Ryw")
            })
                .then(subscription => {
                    // Dit moet naar de server verzonden worden....(via fetch request).
                    // Bekijk van bovenstaande object de property 'endpoint', 'keys', ...
                    // Ga naar het eigen back-end end point waar de Express server luistert naar
                    // POST info (api/save-subscription) en geef info mee.
                    var options = {
                        method: "POST",
                        headers: { "Content-type": "application/json" },
                        body: JSON.stringify(subscription)
                    };
                    fetch("api/save-subscription", options)
                        .then(response => {
                            console.log("Response: ", response)
                            return response.json();
                        })
                        .then(response => {
                            console.log(response)
                            window.localStorage.setItem('subscribed', true);
                            console.log('set subscribed to true!')
                        })
                        .catch(error => console.log("Error: ", error));
                })
                .catch(error => console.log(error));
        });
    }


});