import { BaseController } from './BaseController'
import User from '../Models/User'
import Account from '../Models/Account'
import Async from 'async'






let AccountController = new class AccountController extends BaseController {
    constructor(){
        let notFoundMsg = 'ToDo List not found'
        super(notFoundMsg)
    }

    index(request, reply) {
        Account.find({}, (err, accounts) => {
            if (!err) {
                reply(accounts);
            } else {
                reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }

    create(request, reply) {
        // console.log(request.auth.credentials);
        var account = new Account({
            accountName: request.payload.accountName,
            users:[{
                role: "ADMIN",
                _id: request.auth.credentials.id
            }],
            entry_date : new Date()
        });
        // console.log(account);
        account.save((err, account) => {
            if (!err) {
                var userId = request.auth.credentials.id;
                var item = {
                    role: "ADMIN",
                    _id: account._id
                };
                var update = {$push: {"accounts": item}};
                var options = {new: true};
                User.findByIdAndUpdate(
                    userId,
                    update,
                    options,
                    (err, user) => {
                         if (!err) {
                            reply({account: account, user: user}).created('/account/' + account._id);
                         } else {
                             if (11000 === err.code || 11001 === err.code) {
                                 callback(Boom.forbidden("please provide another account id, it already exist"),null);
                             } else callback(Boom.forbidden(err),null); // HTTP 403
                         }
                     }
                );          
            } else {
                if (11000 === err.code || 11001 === err.code) {
                    reply(Boom.forbidden(err));
                } else reply(Boom.forbidden(err)); // HTTP 403
            }
        });
    }
}

export default AccountController;
