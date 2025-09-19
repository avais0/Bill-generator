function billGe(){
  var totalItem = parseInt(prompt("Enter number of items:"));
  var total= 0;
  for( let i = 1; i <= totalItem; i++){
    var name = prompt("Enter name of item " + i + ":");
    var price = parseFloat(prompt("Enter price of " + name + ":"));
    var qty = parseInt(prompt("Enter quantity of " + name + ":"));
    let itemTotal = price * qty;
    total += itemTotal;
    document.write(name + " x " + qty + " = " + itemTotal.toFixed(2), "<br>");
  }
}
billGe();






















// function billGenerator() {

//   var totalItems = parseInt(prompt("Enter number of items:"));
//   var subtotal = 0;

//   for (let i = 1; i <= totalItems; i++) {
//     var name = prompt("Enter name of item " + i + ":");
//     var price = parseFloat(prompt("Enter price of " + name + ":"));
//     var qty = parseInt(prompt("Enter quantity of " + name + ":"));

//     let itemTotal = price * qty;
//     subtotal += itemTotal;

//     document.write(name + " x " + qty + " = " + itemTotal.toFixed(2), "<br>");
//  }
  
//   document.write(
//     "Subtotal: " + subtotal.toFixed(2) +
//     "\nGrand Total: " + grandTotal.toFixed(2)
//   );
// }

// billGenerator();
