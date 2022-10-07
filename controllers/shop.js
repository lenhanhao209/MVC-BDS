const Product = require("../models/product");
const User = require("../models/user");

const ITEMS_PER_PAGE = 12;
if (typeof localStorage === "undefined" || localStorage === null) {
  const LocalStorage = require("node-localstorage").LocalStorage;
  localStorage = new LocalStorage("./scartch");
}
const recentProduct = localStorage.getItem("product")
  ? JSON.parse(localStorage.getItem("product"))
  : [];

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!recentProduct.some((recent) => recent.id === prodId)) {
        recentProduct.push(product);
        localStorage.setItem("product", JSON.stringify(recentProduct));
      }
      const userId = product.userId;
      User.findById(userId).then((user) => {
        res.render("shop/product-detail", {
          product: product,
          user: user,
          pageTitle: product.title,
          path: "/products",
        });
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find({ published: true })
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find({ published: true })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getRecent = (req, res, next) => {
  console.log(recentProduct);
  const page = +req.query.page || 1;
  res.render("shop/recent", {
    prods: recentProduct,
    pageTitle: "Shop",
    path: "/recent",
    currentPage: page,
    hasNextPage: ITEMS_PER_PAGE * page < recentProduct,
    hasPreviousPage: page > 1,
    nextPage: page + 1,
    previousPage: page - 1,
    lastPage: Math.ceil(recentProduct / ITEMS_PER_PAGE),
  });
};
