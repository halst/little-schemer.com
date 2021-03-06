{test, assert, print} = require './ytest.coffee'
{Cell, List, Env} = require './little.coffee'


test 'pair', ->
    assert Cell(1, 2).car.number == 1
    assert Cell(1, 2).cdr.number == 2
    assert Cell(1, 2).write() == '(1 . 2)'
    assert Cell(1, Cell(2, 3)).write() == '(1 2 . 3)'

    assert Cell(1, 2).pair?
    assert not Cell(1, 2).null?
    assert not Cell(1, 2).number?
    assert not Cell(1, 2).symbol?
    assert not Cell(1, 2).atom?


test 'symbol', ->
    assert Cell('hai').symbol == 'hai'
    assert Cell('hai').write() == 'hai'

    assert not Cell('hai').pair?
    assert not Cell('hai').null?
    assert not Cell('hai').number?
    assert Cell('hai').symbol?
    assert Cell('hai').atom?


test 'number', ->
    assert Cell(1).number == 1
    assert Cell('1').number == 1
    assert Cell(1).write() == '1'

    assert not Cell(1).pair?
    assert not Cell(1).null?
    assert Cell(1).number?
    assert not Cell(1).symbol?
    assert Cell(1).atom?


test 'null', ->
    assert Cell(null).null
    assert Cell(null).write() == '()'

    assert not Cell(null).pair?
    assert Cell(null).null?
    assert not Cell(null).number?
    assert not Cell(null).symbol?
    assert not Cell(null).atom?


test 'list', ->
    assert List(1, 2, 3, 4, 5).pair?
    assert List(1, 2, 3, 4, 5).write() == '(1 2 3 4 5)'
    assert List().write() == '()'


test 'is_eq', ->
    assert Cell(null).is_eq Cell(null)
    assert Cell('hai').is_eq Cell('hai')
    assert not Cell('bye').is_eq Cell('hai')

    law = 'eq? takes two non-numeric atoms'
    assert.raises law, ->
        Cell(1, 2).is_eq Cell(1, 2)
    assert.raises law, ->
        Cell(1).is_eq Cell(1)
    assert.raises law, ->
        List(1, 2, 3).is_eq List(1, 2, 3)


test 'read', ->
    assert Cell.read('()').null?
    assert Cell.read('\n(\t ) ').write() == '()'
    assert Cell.read("'()").write() == '(quote ())'
    assert Cell.read('hai').write() == 'hai'
    assert Cell.read('(hai)').write() == '(hai)'
    assert Cell.read('(hai bye)').write() == '(hai bye)'
    assert Cell._read('(hai bye)')[1] == ''
    assert Cell.read("'(hai bye)").write() == '(quote (hai bye))'
    assert Cell.read('(hai . bye)').write() == '(hai . bye)'
    assert Cell.read('(hai . bye)').cdr.write() == 'bye'
    assert.raises 'missing ")"', ->
        Cell.read('(')
    assert.raises 'missing ")"', ->
        Cell.read('(hai ')
    assert.raises 'no delimiter after dot', ->
        Cell.read('(hai .a)')
    assert Cell.read('(define list\n  (lambda l l))').write() == \
                     '(define list (lambda l l))'
    assert Cell.read('1').number == 1


evaluate = (expr, env=Env()) ->
    Cell.read(expr).eval(env).write()


test 'eval', ->
    assert Cell(1).eval().write() == '1'
    assert evaluate('1') == '1'
    assert evaluate('#t') == '#t'
    assert evaluate('#f') == '#f'
    assert evaluate("'a") == 'a'
    assert evaluate('(quote (0 #t a))') == '(0 #t a)'
    assert evaluate('a', Env(a: Cell(1))) == '1'
    assert evaluate('b', Env(a: Cell(1), b: Cell(2))) == '2'
    assert evaluate('b', Env({a: Cell(1)}, {b: Cell(2)})) == '2'
    assert.raises 'unbound variable b', ->
        evaluate('b', Env(a: 1))


test 'environments', ->
    assert Env(x: 0).extend()['=='] Env({x: 0}, {})
    assert Env().extend(Env(x: 0))['=='] Env({}, {x: 0})

    assert Env().define('a', 1)['=='] Env(a: 1)
    assert Env(a: 1).lookup('a') == 1

    assert Env(a: 1).define('a', 2)['=='] Env(a: 2)
    assert Env({a: 1}, {}).define('a', 2)['=='] Env({a: 1}, {a: 2})

    assert Env().lookup('define').special?
    assert Env().lookup('car').primitive?


test 'cond', ->
    assert evaluate('(cond (#t 1) (#t 2))') == '1'
    assert evaluate('(cond (#f 1) (#t 2))') == '2'
    assert evaluate('(cond (#f 1) (#f 2) (0 3))') == '3'
    assert evaluate('(cond (#f 1) (#f 2) (else 3))') == '3'


test 'primitives', ->
    assert Cell(primitive: true, name: 'hai').primitive?
    assert Cell(primitive: true, name: 'hai').write().indexOf('hai') != -1

    assert List('add1', 1).eval().number == 2
    assert List('eq?', '#t', '#t').eval().symbol == '#t'

    assert Cell.read('(add1 (sub1 5))').eval().write() == '5'
    assert Cell.read('(zero? (sub1 1))').eval().write() == '#t'
    assert Cell.read('(car (cons 0 1))').eval().write() == '0'
    assert Cell.read('(cdr (cons 0 1))').eval().write() == '1'
    assert Cell.read('(number? 1))').eval().write() == '#t'
    assert Cell.read('(number? #t))').eval().write() == '#f'


test 'specialties', ->
    assert Cell(special: true, name: 'hai').special?
    assert Cell(special: true, name: 'hai').write().indexOf('hai') != -1


test 'procedures', ->
    proc =
        procedure: Cell.read('(lambda (a) (add1 (add1 a)))')
        env: Env()
    assert Cell(proc).procedure?
    assert Cell(proc).write().indexOf('(lambda (a) (add1 (add1 a)))') != -1
    assert List(List('quote', proc), 1).eval().write() == '3'


test 'integration', ->
    source = '''
             (define map
               (lambda (f l)
                 (cond ((null? l) l)
                       (else (cons (f (car l)) (map f (cdr l)))))))

             (map add1 '(1 2 3 4 5))
             (map add1 (quote (1 2 3 4 5)))
             '''
    assert.equal Cell.evaluate(source), [
        {line: 3, result: 'ok'}
        {line: 5, result: '(2 3 4 5 6)'}
        {line: 6, result: '(2 3 4 5 6)'}
    ]


test 'missing paren', ->
    assert.equal Cell.evaluate("'hai \n (add1 (sub1 1)"), [
        {line: 0, result: 'hai'}
        {line: 1, result: 'error: missing ")"'}
    ]


test 'optimize procedure', ->
    proc =
        procedure: Cell.read('(lambda (a) (add1 (add1 a)))')
        primitive: (args) -> Cell(42)
        env: Env()
    assert Cell(proc).procedure?
    assert Cell(proc).primitive?
    assert Cell(proc).write().indexOf('(lambda (a) (add1 (add1 a)))') != -1
    assert List(List('quote', proc), 1).eval().write() == '42'


test 'optimized arithmetic', ->
    source = '''
             (define +
               (lambda (n m)
                 (cond ((zero? n) m)
                        (else (+ (sub1 n) (add1 m))))))

             (+ 1000000 2000000)
             '''
    assert.equal Cell.evaluate(source), [
        {line: 3, result: 'ok'}
        {line: 5, result: '3000000'}
    ]
