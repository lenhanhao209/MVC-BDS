const Product = require("../models/product");
const User = require("../models/user");

const ITEMS_PER_PAGE = 2;

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      const userId = product.userId;
      User.findById(userId).then((user) => {
        res.render("approve/product-detail", {
          product: product,
          user: user,
          pageTitle: product.title,
          path: "/approve/products",
        });
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getApproveProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find({ published: false })
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find({ published: false })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("approve/index", {
        prods: products,
        pageTitle: "Approve",
        path: "/approve",
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

exports.postConfirm = (req, res, next) => {
  Product.findById(req.body.id)
    .then((product) => {
      product.published = true;
      product.save();
    })
    .then((result) => {
      res.redirect("/manager/approve");
    })
    .catch((error) => {
      console.log(error);
    });
};
