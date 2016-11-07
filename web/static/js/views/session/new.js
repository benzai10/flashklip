import MainView from '../main';

export default class View extends MainView {
  mount() {
    super.mount();

    // Specific logic here
    console.log('SessionNewView mounted')

    $('#email-field').each(function() {
      var elem = $(this);

      // Save current value of element
      elem.data('oldVal', elem.val());

      // Look for changes in the value
      elem.bind("propertychange change click keyup input paste", function(event){
        // If value has changed...
        if (elem.data('oldVal') != elem.val()) {
          // Updated stored value
          elem.data('oldVal', elem.val());

          // Do action
          if (validateEmail(document.getElementById("email-field").value)) {
            document.getElementById("email-submit").classList.remove("disabled")
          } else {
            document.getElementById("email-submit").className += " disabled"
          }
        }
      })
    })

    function validateEmail(email) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    }
  }


  unmount() {
    super.unmount();

    // Specific logic here
    console.log('SessionNewView unmounted');
  }
}
