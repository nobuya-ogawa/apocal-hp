(function () {
  'use strict';

  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbyVTe8Ti2k6f10aVZ6G_xdKkFmqaHdRJjfKvE_Ubsoag6Qc6lgqa5UOwA7tEtbZCe_uCQ/exec';
  var form = document.getElementById('contactForm');
  var submit = document.getElementById('formSubmit');
  var status = document.getElementById('formStatus');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submit.disabled = true;
    status.textContent = '送信しています。しばらくお待ちください。';

    var data = new URLSearchParams(new FormData(form));
    fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: data.toString(),
    }).then(function () {
      sessionStorage.setItem('apocal-contact-complete', String(Date.now()));
      window.location.assign('/contact/thanks.html');
    }).catch(function () {
      submit.disabled = false;
      status.textContent = '送信に失敗しました。時間をおいて再度お試しください。';
    });
  });
})();
