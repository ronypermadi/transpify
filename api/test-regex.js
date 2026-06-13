const image1 = "data:image/heic;base64,AAAA";
const image2 = "data:application/octet-stream;base64,AAAA";
const image3 = "data:;base64,AAAA";
const regex = /^data:image\/\w+;base64,/;
console.log(image1.replace(regex, ''));
console.log(image2.replace(regex, ''));
console.log(image3.replace(regex, ''));
