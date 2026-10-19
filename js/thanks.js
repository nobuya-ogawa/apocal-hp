(function () {
  'use strict';

  var submittedAt = Number(sessionStorage.getItem('apocal-contact-complete'));
  var isRecentSubmission = submittedAt && Date.now() - submittedAt < 15 * 60 * 1000;
  if (!isRecentSubmission) {
    window.location.replace('/contact/');
    return;
  }

  // 完了ページを直接再表示できないよう、表示後に一時印を削除します。
  sessionStorage.removeItem('apocal-contact-complete');
})();
