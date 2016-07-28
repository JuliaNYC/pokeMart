'use strict'

var router = require('express').Router();
var UserOrders = require('../../db/models/userOrders');
var OrderDetails = require('../../db/models/orderDetails');

// req.session.orderId =
router.use(function (req, res, next) {
    req.searchObj = (!req.user) ?
                    {id: req.session.orderId, status: 'pending'} :
                    {userId: req.user.id, status: 'pending'}
    next();
})

// OB/SB: cart middleware? e.g. req.cart = ... followed by next()

router.get('/cart', function (req, res, next) {

    // OB/SB: bury dead code
    /*
        if req.session.orderId is null
        cartItems = null
    */
    UserOrders.findOne({
        where: req.searchObj
    }).then(function (userOrder) {
        return OrderDetails.findAll({
            where: {
                userOrderId: userOrder.id
            }
        })
    }).then(function (cartItems) {
        res.send(cartItems);
    }).catch(next);

});

 // req.body = {
 //    userId
 //    productId
 //    quantity
 // }

router.post('/cart', function (req, res, next) {

    // OB/SB: hopefully this could be simplified maybe either using an association method `req.cart.createOrderDetails(...)` or a custom method
    UserOrders.findOne({
        where: req.searchObj // user order entry is not created
    }).then(function (userOrder) {
        if (!userOrder) {
            return UserOrders.create({status: 'pending'})
        } else {
            return userOrder;
        }
    })
    .then(function (userOrder) {
        if (!req.session.orderId) req.session.orderId = userOrder.id;
        return OrderDetails.create(req.body)
        .then(function (orderDetail) { // OB/SB: avoid nested .thens
            return orderDetail.setUserOrder(userOrder.id)
        })
    }).then(function (orderDetail) {
        res.send(orderDetail)
    }).catch(next);
});

// OB/SB: /cart/:productId
router.delete('/:productId', function (req, res, next) {
    // product id needs to be sent to front end
    UserOrders.findOne({
        where: req.searchObj
    }).then(function (userOrder) {
        return OrderDetails.destroy({
            where: {
                userOrderId: userOrder.id,
                productId: req.params.productId
            }
        })
    }).then(function () {
        res.status(204).end();
    }).catch(next);
});

// req.body = {
//     quantity
// }

// req.params.orderDetailId // modified in front end
// OB/SB: maybe go with productId instead, for consistency
router.put('/:orderDetailId', function (req, res, next) {
    OrderDetails.findById(req.params.orderDetailId)
    .then(function(orderDetail) {
        return orderDetail.update({quantity: req.body.quantity})
    }).then(function (updatedOrderDetail) {
        res.send(updatedOrderDetail)
    }).catch(next);
});

// OB/SB: alternative /api/users/me/orders
router.get('/paid', function (req, res, next) {
    // OB/SB: try to move all this to some model method
    /*
    req.user.getOrders({
        where: {status: 'paid'},
        include: [OrderDetails]
    })
    .then(function (orders) {
        // orders: array of order instances
        // each instance will have a .orderDetails property because of the include
    });
    */
    UserOrders.findAll({
        where: {
            userId: req.user.id, // from session/auth
            status: 'paid'
        }
    }).then(function (userOrders) {
        return userOrders.map(userOrder => {
            return OrderDetails.findAll({
                where: {userOrderId: userOrder.id}
            })
        });
    }).then(function (itemPromises) {
        return Promise.all(itemPromises);
    }).then(function (paidItemsArr) {
        res.send(paidItemsArr)
    }).catch(next);
});

router.get('/fulfilled', function (req, res, next) {
    UserOrders.findAll({
        where: {
            userId: req.user.id, // from session/auth
            status: 'fulfilled'
        }
    }).then(function (userOrders) {
        return userOrders.map(userOrder => {
            return OrderDetails.findAll({
                where: {userOrderId: userOrder.id}
            })
        });
    }).then(function (itemPromises) {
        return Promise.all(itemPromises);
    }).then(function (shippedItemsArr) {
        res.send(shippedItemsArr)
    }).catch(next);
});

module.exports = router;
