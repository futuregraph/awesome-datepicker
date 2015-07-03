(function (ng, app) {

    /**
     * @author Vitaly Gridnev
     */

    app.service('$RangesService', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
        return new RangesCtrl($rootScope, $timeout)
    } ] );

    var DATE_FORMAT = 'D.M.YYYY', // moment.js date format
        RangesCtrl = function ($scope, $timeout) {

            var RANGES = [],
                DATEPICKERS = [],
                RANGE_MIN_VAL = moment( '01.01.1900', DATE_FORMAT ),
                RANGE_MAX_VAL = moment( '01.01.2100', DATE_FORMAT );


            function getBounds(){
                return {
                    min: RANGE_MIN_VAL.clone(),
                    max: RANGE_MAX_VAL.clone()
                }
            }

            /**
             * Добавляет период в сервис
             *
             * @param {Range} range
             * @returns {Range}
             */
            function addRange (range) {
                RANGES.push( range )
                return range
            }

            /**
             * Получение активного периода для конкретного дейтпикера
             *
             * @param datepicker имя дейтпикера
             * @param [date_selected] поиск активного периода, в который входит переданная дата
             * @returns {Range}
             */
            function getActiveRangeForDatepicker (datepicker, date_selected) {

                var _ranges = getSplittedRangesForDatepicker( datepicker ),
                    date_selected = !!date_selected ? moment( date_selected, DATE_FORMAT ).toDate() : false,
                    result = {
                        //from: RANGE_MIN_VAL.clone(),
                        //to: RANGE_MAX_VAL.clone()
                    };


                if ( date_selected && _ranges.length > 0){

                    if ( !_ranges[0].from.isSame( RANGE_MIN_VAL ) ) { // если период не сначала
                        if ( date_selected > RANGE_MIN_VAL.toDate() && date_selected < _ranges[0].from.toDate() ) { // если дата между минимумом и началом периода
                            result.from = RANGE_MIN_VAL.clone()
                            result.to = _ranges[0].from.clone();
                            return result;
                        }
                    }

                }

                if ( _ranges.length == 1 ){

                    var range = _ranges[0];

                    if ( _ranges[0].from.isSame( RANGE_MIN_VAL) ){
                        result.from = range.to;
                    } else {
                        result.to = range.from;
                    }

                } else {
                    for ( var i = 0, till = _ranges.length - 1; i < till; i++ ) {

                        var range1 = _ranges[i],
                            range2 = _ranges[i + 1];

                        if ( range1.to.diff( range2.from ) < 0 ) { // если между ними есть разрыв
                            if ( date_selected ) {
                                if ( date_selected >= range1.to.toDate() && date_selected <= range2.from.toDate() ) { // если искомая дата входит в разрыв
                                    result.from = range1.to;
                                    result.to = range2.from;
                                    break;
                                } else {
                                    result.from = range2.to;
                                }
                            } else {
                                result.from = range1.to;
                                result.to = range2.from;
                                break;
                            }
                        } else { // если нет разрыва
                            if ( range1.to.diff( range2.to ) < 0 ) { // если конец второго позже конца первого
                                result.from = range2.to;
                            } else {
                                if ( range1.from.diff( range2.from) < 0 ){
                                    result.from = range1.to;
                                } else {
                                    result.from = range2.to;
                                }
                            }
                        }
                    }
                }

                result.from =  !!result.from ? result.from.clone() : RANGE_MIN_VAL.clone()
                result.to =  !!result.to ? result.to.clone() : RANGE_MAX_VAL.clone()
                return result

            }


            /**
             * Оповещаем об изменениях
             */
            function broadcastChange () {
                $scope.$broadcast( 'RangesChanged' )
            }


            /**
             * Удалить период
             * @param {Range} range
             */
            function removeRange (range) {
                RANGES.splice( RANGES.indexOf( range ), 1 );
            }


            /**
             * сбросить периоды
             * @param {String} [type] название типа
             */
            function flush(type) {

                type = !!type ? type : undefined;

                var rangesToFlush = [];

                if (type) {

                    rangesToFlush = _.filter(RANGES, function (range) {
                        return range.type == type
                    });

                    _.each(rangesToFlush, function (range) {
                        range.remove()
                    })

                } else {
                    // удаляем всё, кроме дефолтных ограничений
                    var rangesToFlush = _.filter(RANGES, function (range) {
                        return range.type !== 'default'
                    })

                    _.each(rangesToFlush, function (range) {
                        range.remove()
                    });

                    broadcastChange();
                }

                console.warn('ranges flushed', type)
            }


            /**
             * Получить "схлопнутый" по датам список периодов
             * @param name
             * @returns {Array}
             */
            function getSplittedRangesForDatepicker(name ){

                var result = getRangesForDatepicker( name );


                result.sort(function (a, b) {
                    return b.to.diff(b.from) > a.to.diff(a.from);
                })

                var __ranges = result;

                for (var i = 0, till = result.length; i < result.length; i++) {

                    var range1 = result[i];


                    for (var j = i + 1; j < till; j++) {
                        var range2 = result[j];
                        if ((range2.from.isSame(range1.from) || range2.from.isAfter(range1.from)) && (range2.to.isSame(range1.to) || range2.to.isBefore(range1.to))) {
                            __ranges = _.without(__ranges, range2);
                        } else if ((range1.from.isSame(range2.from) || range1.from.isAfter(range2.from)) && (range1.to.isSame(range2.to) || range1.to.isBefore(range2.to))) {
                            __ranges = _.without(__ranges, range1);
                        }
                    }
                }

                result = __ranges;


                result.sort(function (a, b) {

                    var result = 0;

                    if (a.from.diff(b.from) < 0) {
                        result = -1;
                    } else if (a.from.isSame(b.from)) {

                        if (a.to.diff(b.to) < 0) {
                            result = -1
                        } else
                            result = 1

                    } else {
                        result = 1;
                    }

                    return result

                })

                return result;
            }

            /**
             * получение периодов для конкретного дэйтпикера
             * @param name
             * @returns {Array}
             */
            function getRangesForDatepicker (name) {


                var result = [];

                _.each( RANGES, function (range) {

                    if ( range.isEnabled ){
                        if (!/datepicker/.test(range.type)) {  // если это период с типом backend
                            if (!_.contains(range.expects, name)){ // и он не исключён
                                result.push(range)
                            }
                        } else {
                            if ( range.type == 'datepicker_' + name ) {

                                if ( range.from === null ) {
                                    range.from = RANGE_MIN_VAL.clone()
                                }

                                if ( range.to === null ) {
                                    range.to = RANGE_MAX_VAL.clone();
                                }

                                result.push( range )
                            }
                        }
                    }
                } )

                return result;
            }

            /**
             * проверка, можно ли выбрать определенную дату (заблокирована?)
             * @param date
             * @returns {{selectable: boolean, message: string}}
             */
            function isDateSelectable (date) {

                if (!SERVICE_ENABLED) return {
                    selectable:true,
                    message: ''
                }

                var datepicker = this,
                    result = {
                        selectable: true,
                        message: ''
                    },
                    date = moment( date ),
                    rangesToCheck = getRangesForDatepicker( datepicker );

                for ( var i in rangesToCheck ) {

                    var range = rangesToCheck[i],
                        _d = date.toDate(),
                        _f = range.from.toDate(),
                        _t = range.to.toDate();

                    if ( _d >= _f && _d <= _t ) {
                        result.selectable = false;
                        result.message = range.message;
                        result.blockedBy = range;

                        break;
                    }

                }

                return result;
            }


            /**
             * Создание зависимого периода
             * не отличается ничем, кроме типа, который устанавливается в 'datepicker_'+type
             *
             * @param type
             * @param message
             * @param disabled
             * @returns {Range}
             */
            function createDependentRange (type, message, disabled) {

                var disabled = !!disabled,
                    range = createRange( null, null, type, message, !disabled );

                range.type = 'datepicker_' + type;

                return range
            }


            /**
             * Парсинг даты
             * @param {Variant} obj может быть строкой, стампом с бэкэнда или объектом Moment JS
             * @returns {Moment}
             */
            function parseDate (obj) {

                if ( obj === null ) {
                    return ''
                }

                // если строка
                if ( typeof obj == 'string' ) {

                    var backendStampExp = /^\/Date\((\d+)\)\/$/, dependenceStampExp = /(\d+).(\d+).(\d+)/, date;

                    if ( backendStampExp.test( obj ) ) {
                        date = new Date( parseInt( obj.match( backendStampExp )[1], 10 ) )
                    } else if ( dependenceStampExp.test( obj ) ) {
                        var matches = obj.match( dependenceStampExp );
                        date = new Date( matches[3], matches[2] - 1, matches[1] )
                    }
                    return moment( new Date( date ) ).startOf( 'day' )
                }


                if ( moment.isMoment( obj ) ) {
                    return obj.startOf( 'day' )
                }

                return ''
            }


            /**
             * Создаёт период
             *
             * @param {Variant} from дата начала, либо null, либо /Date/, либо moment
             * @param {Variant} to дата конца, либо null, либо /Date/, либо moment
             * @param {String} type тип периода
             * @param {String} message сообщение периода
             * @returns {Range}
             */
            function createRange (from, to, type, message) {

                var enabled = true,
                    from = parseDate( from ),
                    to = parseDate( to ),
                    type = type,
                    message = message,
                    result;


                from = from == '' ? RANGE_MIN_VAL.clone() : from;
                to = to == '' ? RANGE_MAX_VAL.clone() : to;

                result = {
                    from: from,
                    to: to,
                    type: type,
                    message: message,
                    isEnabled: enabled,
                    enable: function(){
                        this.isEnabled = true;
                    },
                    expects: [],
                    expect: function (datepicker) {
                        this.expects.push( datepicker )
                        //console.log( 'expect ', message, ' for ', datepicker)
                    },
                    disable: function(){
                        this.isEnabled = false;
                    },
                    remove: function () {
                        removeRange( this )
                    }
                };

                addRange( result );

                return result;

            }


            /**
             * Понимает формат периодов с бэкэнда
             * Возвращает стандартный период
             *
             * @param _arr период с бэкэнда
             * @returns {Range}
             */
            function createBackendRange (_arr) {

                var from = _arr.DateStart,
                    to = _arr.DateEnd,
                    message = _arr.Reason,
                    result = createRange( from, to, 'backend', message )

                return result;
            }


            /**
             * Возвращает весь список периодов
             * Для какого-нибудь хардкодинга
             *
             * @returns {Ranges[]}
             */
            function getList () {
                return RANGES;
            }


            /**
             * Добавляет в сервис ограничения по умолчанию
             */
            function addDefaultBounds () {

                var bounds = [],
                    today = moment();

                // например, не больше трёх лет от текущей даты
                // bounds.push( createRange( today.clone().add( 3, 'year' ), null, 'default', 'Не может быть более трех лет от текущей даты' ) )

                for ( var bound in bounds ) {
                    addRange( bounds[bound] )
                }

            }

            var SERVICE_ENABLED = !0;
            // вотчер для списка периодов
            $scope.$watch(function () {
                var list = {};
                _.each(RANGES, function (range, index) {
                    list[index] = (range.from !== null && range.from.format(DATE_FORMAT)) + (range.to !== null && range.to.format(DATE_FORMAT)) + range.isEnabled;
                });
                return list
            }, function () {
                if ( SERVICE_ENABLED ){
                    broadcastChange();
                }
            }, true);



            function init () {

                // TODO: добавить ограничения по умолчанию (+3 года, etc)
                addDefaultBounds()

                /**
                 * @class RangesService
                 * @constructor
                 */
                return {
                    getBounds: getBounds,
                    addRange: addRange,
                    removeRange: removeRange,
                    createRange: createRange,
                    createBackendRange: createBackendRange,
                    getSplittedRangesForDatepicker: getSplittedRangesForDatepicker,
                    getRangesForDatepicker: getRangesForDatepicker,
                    getActiveRangeForDatepicker: getActiveRangeForDatepicker,
                    createDependentRange: createDependentRange,
                    isDateSelectable: isDateSelectable,
                    flush: flush,
                    isWorking: SERVICE_ENABLED,
                    getList: getList
                }
            }


            return init()
    }

}( angular, angular.module('awesome-datepicker') ));