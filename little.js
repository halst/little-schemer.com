// Generated by CoffeeScript 1.4.0
(function() {
  var Cell, DELIMITER, List, define, eval_operands, lookup, print, provide, set,
    __slice = [].slice;

  print = function() {
    return console.log.apply(console, arguments);
  };

  DELIMITER = /(\s|\))/;

  define = function(args, env) {
    var dval, dvar, frame, vals, vars;
    dvar = args.car;
    dval = args.cdr.car;
    frame = env.car;
    vars = frame.car;
    vals = frame.cdr.car;
    while (!(vars["null"] != null)) {
      if (vars.car.symbol === dvar.symbol) {
        vals.car = dval;
        return 'ok';
      }
      vars = vars.cdr;
      vals = vals.cdr;
    }
    frame.car = Cell(dvar, frame.car);
    frame.cdr.car = Cell(dval, frame.cdr.car);
    return 'ok';
  };

  lookup = function(expr, env) {
    var frame, vals, vars;
    while (!(env["null"] != null)) {
      frame = env.car;
      vars = frame.car;
      vals = frame.cdr.car;
      while (!(vars["null"] != null)) {
        if (vars.car.symbol === expr.symbol) {
          return vals.car;
        }
        vars = vars.cdr;
        vals = vals.cdr;
      }
      env = env.cdr;
    }
    throw "unbound variable " + (expr.write());
  };

  set = function(args, env) {
    var frame, sval, svar, vals, vars;
    svar = args.car;
    sval = args.cdr.car;
    while (!(env["null"] != null)) {
      frame = env.car;
      vars = frame.car;
      vals = frame.cdr.car;
      while (!(vars["null"] != null)) {
        if (vars.car.symbol === svar.symbol) {
          vals.car = sval;
          return 'ok';
        }
        vars = vars.cdr;
        vals = vals.cdr;
      }
      env = env.cdr;
    }
    throw "unbound variable " + (svar.write());
  };

  eval_operands = function(operands, env) {
    if (operands["null"] != null) {
      return List();
    }
    return Cell(operands.car["eval"](env), eval_operands(operands.cdr, env));
  };

  Cell = (function() {

    function Cell() {
      var args, car, cdr, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 2) {
        car = args[0], cdr = args[1];
        this.car = car.cell != null ? car : Cell(car);
        this.cdr = cdr.cell != null ? cdr : Cell(cdr);
        this.pair = true;
      } else if (args[0] === null) {
        this["null"] = true;
      } else if (typeof args[0] === 'number' || !isNaN(parseInt(args[0]))) {
        this.number = parseInt(args[0]);
        this.atom = true;
        this.self_evaluating = true;
      } else if ((_ref = args[0]) === '#t' || _ref === '#f') {
        this.symbol = args[0];
        this.boolean = true;
        this.atom = true;
        this.self_evaluating = true;
      } else if (typeof args[0] === 'string') {
        this.symbol = args[0];
        this.atom = true;
      } else if (args[0].special != null) {
        this.special = args[0].special;
        this.name = args[0].name;
      } else if (args[0].primitive != null) {
        this.primitive = args[0].primitive;
        this.name = args[0].name;
      } else if (args[0].procedure != null) {
        this.procedure = args[0].procedure;
        this.env = args[0].env;
      } else if (args[0].cell != null) {
        return args[0];
      } else {
        console.log(args[0]);
      }
      this.cell = true;
      if (!(this instanceof Cell)) {
        return (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args);
          return Object(result) === result ? result : child;
        })(Cell, arguments, function(){});
      }
    }

    Cell._read_pair = function(source) {
      var car, cdr, rest, _ref, _ref1, _ref2;
      source = source.trim();
      if (source[0] === ')') {
        return [Cell(null), source.slice(1)];
      }
      _ref = this._read(source), car = _ref[0], rest = _ref[1];
      rest = rest.trim();
      if (rest === '') {
        throw 'missing right paren';
      }
      if (rest[0] === '.') {
        if (rest.slice(1) === '') {
          throw 'missing right paren';
        }
        if (!DELIMITER.test(rest[1])) {
          throw 'no delimiter after dot';
        }
        _ref1 = this._read(rest.slice(1)), cdr = _ref1[0], rest = _ref1[1];
        if (rest[0] !== ')') {
          throw 'missing right paren';
        }
        return [Cell(car, cdr), rest.slice(1)];
      }
      _ref2 = this._read_pair(rest), cdr = _ref2[0], rest = _ref2[1];
      return [Cell(car, cdr), rest];
    };

    Cell._read = function(source) {
      "Read `String source` and return [Cell parsed, String rest].";

      var char, quoted, rest, symbol, _ref, _ref1;
      source = source.trim();
      char = source[0];
      rest = source.slice(1);
      if (char === '(') {
        return this._read_pair(rest);
      } else if (char === "'") {
        _ref = this._read(rest), quoted = _ref[0], rest = _ref[1];
        return [List('quote', quoted), rest];
      } else {
        _ref1 = source.split(DELIMITER), symbol = _ref1[0], rest = 2 <= _ref1.length ? __slice.call(_ref1, 1) : [];
        return [Cell(symbol), rest.join('')];
      }
    };

    Cell.read = function(source) {
      return this._read(source)[0];
    };

    Cell.prototype.eval_simple = function(env) {};

    Cell.prototype["eval"] = function(env) {
      var args, body, condition, consequence, expr, operator, para;
      if (env == null) {
        env = null;
      }
      if (!(env != null)) {
        env = Cell.default_env();
      }
      expr = this;
      while (true) {
        if (expr.self_evaluating != null) {
          return expr;
        } else if (expr.symbol != null) {
          return lookup(expr, env);
        } else if ((expr.pair != null) && expr.car.symbol === 'cond') {
          body = expr.cdr;
          if (body["null"] != null) {
            return Cell('#f');
          }
          condition = body.car.car;
          if (condition.symbol === 'else') {
            condition = Cell('#t');
          }
          consequence = body.car.cdr.car;
          if (condition["eval"](env).symbol !== '#f') {
            expr = consequence;
          } else {
            expr = Cell('cond', body.cdr);
          }
        } else if ((expr.pair != null) && (expr.car.special != null)) {
          operator = expr.car;
          args = expr.cdr;
          return Cell(operator.special(args, env));
        } else if ((expr.pair != null) && (expr.car.primitive != null)) {
          operator = expr.car;
          args = eval_operands(expr.cdr, env);
          return Cell(operator.primitive(args));
        } else if ((expr.pair != null) && (expr.car.procedure != null)) {
          operator = expr.car;
          args = eval_operands(expr.cdr, env);
          para = operator.procedure.cdr.car;
          body = operator.procedure.cdr.cdr.car;
          env = Cell(List(para, args), operator.env);
          expr = body;
        } else if (expr.pair != null) {
          expr.car = expr.car["eval"](env);
        } else {
          throw "eval error: " + (expr.write());
        }
      }
    };

    Cell.evaluate = function(source) {
      var env, line, parsed, rest, result, _ref;
      env = Cell.default_env();
      result = [];
      line = 0;
      while (source !== '') {
        _ref = Cell._read(source), parsed = _ref[0], rest = _ref[1];
        line = source.replace(rest, '').match(/\n/g).length + line;
        source = rest;
        result.push({
          line: line,
          result: parsed["eval"](env).write()
        });
      }
      return result;
    };

    Cell.default_env = function() {
      var env, func, name, _ref, _ref1;
      env = this.read('((() ()))');
      _ref = this._specialties;
      for (name in _ref) {
        func = _ref[name];
        define(List(name, {
          special: func,
          name: name
        }), env);
      }
      _ref1 = this._primitives;
      for (name in _ref1) {
        func = _ref1[name];
        define(List(name, {
          primitive: func,
          name: name
        }), env);
      }
      return env;
    };

    Cell._primitives = {
      'null?': function(args) {
        if (args.car["null"] != null) {
          return '#t';
        } else {
          return '#f';
        }
      },
      'atom?': function(args) {
        if (args.car.atom != null) {
          return '#t';
        } else {
          return '#f';
        }
      },
      'eq?': function(args) {
        if (args.car.is_eq(args.cdr.car)) {
          return '#t';
        } else {
          return '#f';
        }
      },
      'cons': function(args) {
        return Cell(args.car, args.cdr.car);
      },
      'car': function(args) {
        return args.car.car;
      },
      'cdr': function(args) {
        return args.car.cdr;
      },
      'zero?': function(args) {
        if (args.car.number === 0) {
          return '#t';
        } else {
          return '#f';
        }
      },
      'add1': function(args) {
        return args.car.number + 1;
      },
      'sub1': function(args) {
        return args.car.number - 1;
      },
      'number?': function(args) {
        if (args.car.number != null) {
          return '#t';
        } else {
          return '#f';
        }
      }
    };

    Cell._specialties = {
      'quote': function(args, env) {
        return args.car;
      },
      'define': function(args, env) {
        args.cdr.car = args.cdr.car["eval"](env);
        return define(args, env);
      },
      'set!': function(args, env) {
        return set(args, env);
      },
      'env': function(args, env) {
        return env;
      },
      'lambda': function(args, env) {
        return {
          procedure: Cell('lambda', args),
          env: env
        };
      }
    };

    Cell.prototype._write_pair = function() {
      if (this.cdr["null"] != null) {
        return "" + (this.car.write());
      } else if (this.cdr.pair != null) {
        return "" + (this.car.write()) + " " + (this.cdr._write_pair());
      } else if (this.cdr.write != null) {
        return "" + (this.car.write()) + " . " + (this.cdr.write());
      } else {
        return '#<wtf>';
      }
    };

    Cell.prototype.write = function() {
      if (this.pair != null) {
        return "(" + (this._write_pair()) + ")";
      } else if (this.symbol != null) {
        return this.symbol;
      } else if (this["null"] != null) {
        return '()';
      } else if (this.number != null) {
        return this.number.toString();
      } else if ((this.primitive != null) || (this.special != null)) {
        return this.name;
      } else if (this.procedure != null) {
        return this.procedure.write();
      } else {
        throw 'write error';
      }
    };

    Cell.prototype.is_eq = function(other) {
      var law;
      law = 'eq? takes two non-numeric atoms';
      if ((this["null"] != null) && (other["null"] != null)) {
        return true;
      } else if ((this.symbol != null) && (other.symbol != null)) {
        return this.symbol === other.symbol;
      } else {
        throw law;
      }
    };

    return Cell;

  })();

  List = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (args.length === 0) {
      return Cell(null);
    } else {
      return Cell(args[0], List.apply(null, args.slice(1)));
    }
  };

  provide = {
    Cell: Cell,
    List: List,
    "eval": Cell.evaluate
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = provide;
  } else {
    window.little = provide;
  }

}).call(this);
