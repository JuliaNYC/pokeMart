'use strict'

var router = require('express').Router();
var Products=require('../../db/models/product');
var HttpError = require('../../utils/HttpError');

router.get('/', function(req, res, next) {
  Products.findAll()
  .then(function(allProducts){
  	res.send(allProducts);
  })
  .catch(next);
});

// OB/SB: recommend query string, e.g. ?category=foo
// OB/SB: if so you could probably delete this one and fold the logic into the above route handler
router.get('/category/:category', function(req, res, next) {
  Products.findAll({
  	where:{
  		category:req.params.category
  	}
  })

  .then(function(foundProducts){
  	res.send(foundProducts);
  })
  .catch(next);
});

// OB/SB: check out express router.param—will dry out routes with repeated logic

router.param('id', function(req, res, next, theId){
	Products.findById(theId)
	.then(function(product){
		if(product){
			req.product = product;
			next();
			return null;
		}else{
			throw HttpError(404);
		}
	})
	.catch(next);
})

router.get('/:id', function(req,res,next){
	res.send(req.product);
})

router.post('/', function(req,res,next){
	Products.create(req.body)
	.then(function(newProduct){
		res.status(201).send(newProduct);
	})
	.catch(next);
})

router.put('/:id', function(req,res,next){
	var id=req.params.id;
	Products.findById(id)
	.then(function(product){
		if (!product){
			throw HttpError(404);
			// res.status(404).send(); // OB/SB: consider throwing error
		}
		else {
			return product.update(req.body);
		}
	})
	.then(function(updatedProduct){
		res.send(updatedProduct);
	})
	.catch(next);
})

router.delete('/:id', function(req,res,next){
	req.product.destroy()
	.then(function(){
		res.status(204).end();
	})
	.catch(next);
	// 
})

module.exports = router;
