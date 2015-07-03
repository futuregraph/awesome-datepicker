(function(ng, app){

    /**
     * @author Vitaly Gridnev
     * @TODO refactor
     */

    app.directive('awesomeDatepicker', awesomeDatepicker );

    function awesomeDatepicker( $filter, RangesService){

        return {
            restrict: 'E',
            scope: {
                mDate: '=', // дата в формате 1.1.2000
                atm: '@' // приблуда тестеров
            },
            replace: true,
            transclude: false,
            template: '<div class="datepicker">\n    <div class="datepicker-head">\n\t\t<span class="datepicker-btn-left" ng-click="prevMonth()">\n\t\t\t<i class="datepicker-btn-left-tail"></i>\n\t\t</span>\n        <span class="datepicker-value">{{ title }}</span>\n\t\t<span class="datepicker-btn-right" ng-click="nextMonth()">\n\t\t\t<i class="datepicker-btn-right-tail"></i>\n\t\t</span>\n    </div>\n\n    <div class="datepicker-week">\n        <span ng-repeat="item in week">{{ item }}</span>\n    </div>\n\n    <div class="datepicker-body">\n        <div class="datepicker-day-off"></div>\n\t\t<span class="helper datepicker-day-item" ng-repeat="(key, item) in days track by $index" ng-class="{\'disable\' : item.isDisabled, \'current\' : item.isCurrent, \'selfDay\' : item.isToday}" ng-click="choose(item)">\n\t\t\t<span class="helper-block helper-block__datepicker" ng-show="item.isShow">\n\t\t\t\t<i class="helper-block-tail"></i>\n\t\t\t\t{{ item.tooltip }}\n\t\t\t</span>\n\t\t\t{{ item.day }}\n\t\t</span>\n        <div class="datepicker-clear"></div>\n    </div>\n\n    <div class="datepicker-footer">\n        <div data-split-fields class="ctrl-group">\n            <form name="inputValues" ng-submit="clickBtn()">\n                <input class="t-input t-input__micro first" maxlength="2" placeholder="ДД" type="text" data-ng-model="inputValue.day"/><!--\n\t\t\t--><input class="t-input t-input__micro" maxlength="2" placeholder="ММ" type="text" data-ng-model="inputValue.month"/><!--\n\t\t\t--><input class="t-input t-input__mini last" maxlength="4" placeholder="ГГГГ" type="text" data-ng-model="inputValue.year"/>\n\n                <button type="submit" class="btn" style="margin-left:5px;" ng-class="{\'disable\' : isSubmitDisabled}">\n\t\t\t\t<span class="helper-block helper-block__datepicker" ng-show="showSubmitTooltip">\n\t\t\t\t\t<i class="helper-block-tail"></i>\n\t\t\t\t\t{{ submitTooltip }}\n\t\t\t\t</span>\n                    <span class="btn-in">OK</span>\n                </button>\n            </form>\n        </div>\n    </div>\n</div>',
            link: function ($scope, $element, $attrs) {

                var TODAY = new Date(),
                    RENDER_DATE = TODAY,
                    DATE_SELECTED = TODAY;

                $scope.isDisableBtn = false;
                $scope.bindedTo = !!$attrs.alternativeBinding ? $attrs.alternativeBinding : $attrs.mDate;
                $scope.inputValue = {
                    day: parseInt( TODAY.getDay(), 10 ),
                    month: parseInt( TODAY.getMonth()+1, 10 ),
                    year: parseInt( TODAY.getFullYear(), 10 )
                };
                $scope.showSubmitTooltip = false;
                $scope.submitTooltip = '';
                $scope.week = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
                $scope.month = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];


                /**
                 * День недели
                 * @param date
                 * @returns {number}
                 */
                function getDayOfWeek (date) {
                    var day = date.getDay();
                    if ( day == 0 ) day = 7;
                    return day - 1;
                }


                /**
                 * Количество дней в месяце
                 * @param date
                 * @returns {number}
                 */
                function daysInMonth (date) {
                    return 33 - new Date( date.getFullYear(), date.getMonth(), 33 ).getDate();
                }


                /**
                 * Проверки вводимых символов из инпутов
                 * @param $scope
                 * @param inputValue
                 */
                function checkInputsValue ($scope, inputValue) {

                    var _inputValue = _.clone( inputValue );

                    if ( _inputValue.year.length < 4 ){
                        $scope.isSubmitDisabled = true;
                        return;
                    } else {
                        if (_inputValue.year >= 2100) {
                            $scope.inputValue.year = 2100;
                            _inputValue.year = 2100;
                            $scope.submitTooltip = 'Дата недоступна';
                            $scope.isSubmitDisabled = true;
                            return;
                        } else
                        if (_inputValue.year <= 1900) {
                            $scope.inputValue.year = 1900;
                            _inputValue.year = 1900;
                            $scope.submitTooltip = 'Дата недоступна';
                            $scope.isSubmitDisabled = true;
                            return;
                        }


                        var lastDayOfMonth = new Date(_inputValue.year, _inputValue.month, 0).getDate();

                        if ( _inputValue.year % 4 > 0 && _inputValue.month == 2 && _inputValue.day > 28 ){
                            $scope.inputValue.day = 28;
                            _inputValue.day = 28;
                        }

                        if ( _inputValue.month === '00' ){
                            $scope.inputValue.month = '01';
                            _inputValue.month = 1
                        } else if ( _inputValue.month > 12 ){
                            $scope.inputValue.month = 12;
                            _inputValue.month = 12

                        }

                        if ( lastDayOfMonth < _inputValue.day && _inputValue.month !== '' && _inputValue.month !== 0){
                            $scope.inputValue.day = lastDayOfMonth;
                            _inputValue.day = lastDayOfMonth;
                        }

                    }


                    _inputValue.month = parseInt( _inputValue.month, 10 ) == 0 ? 0 : _inputValue.month - 1;

                    var valueToCheck = [ _inputValue.year | 0 , _inputValue.month | 0, _inputValue.day | 0 ];

                    if ( moment( valueToCheck ).isValid() ) {

                        if ( !isDateDisabled( _inputValue ) ) {
                            DATE_SELECTED = new Date( _inputValue.year, _inputValue.month, _inputValue.day );
                            $scope.renderDays( _inputValue.year, _inputValue.month )
                            $scope.isSubmitDisabled = false;
                            $scope.showSubmitTooltip = false;
                        } else {
                            $scope.isSubmitDisabled = true;
                            $scope.submitTooltip = _inputValue.tooltip;
                        }

                    }
                }


                /**
                 * слушаем изменения сервиса периодов
                 */
                $scope.$on( 'RangesChanged', function () {
                    if ( DATE_SELECTED ){
                        $scope.renderDays(DATE_SELECTED.getFullYear(), DATE_SELECTED.getMonth())
                    }
                } )

                /**
                 * Событие при клике на кнопку "ОК"
                 * если выбрана невалидная дата - ругнется и покажет тултип
                 */
                $scope.clickBtn = function () {
                    if ( $scope.isSubmitDisabled ) {
                        $scope.showSubmitTooltip = true;
                        setTimeout( function () {
                            $scope.showSubmitTooltip = false;
                            $scope.$apply();
                        }, 1000 );
                    } else {
                        $scope.choose()
                    }
                };

                /**
                 * формирование дат в календаре
                 * @param year
                 * @param month
                 * @param scrollFlag
                 */
                $scope.renderDays = function (year, month, scrollFlag) {

                    var date = new Date( year, month ),
                        prevMonth = new Date( date.getFullYear(), date.getMonth() - 1);

                    $scope.days = [];
                    $scope.title = $scope.month[date.getMonth()] + ', ' + date.getFullYear();

                    function addDay (d, m, y) {

                        var day = {
                            day: d,
                            month: m,
                            year: y
                        }

                        day.isCurrent = isCurrent( day );
                        day.isDisabled = isDateDisabled( day );
                        day.isToday = isToday( day );

                        $scope.days.push( day )
                    }


                    for ( var i = 0; i < getDayOfWeek( date ); i++ ) { // Добавление дат до текушего месяца
                        addDay( daysInMonth( prevMonth ) - (getDayOfWeek( date ) - i - 1), prevMonth.getMonth(), prevMonth.getFullYear() )
                    }

                    while (date.getMonth() == month) { // Добавляем даты с текущего месяца
                        addDay( date.getDate(), date.getMonth(), date.getFullYear() )
                        date.setDate( date.getDate() + 1 );
                    }

                    if ( getDayOfWeek( date ) != 0 ) { // Добавляем даты после текущего месяца
                        for ( var i = getDayOfWeek( date ); i < 7; i++ ) {
                            addDay( date.getDate(), date.getMonth(), date.getFullYear() )
                            date.setDate( date.getDate() + 1 );
                        }
                    }

                    if ( $scope.days.length == 35 ){
                        for ( var i = 0; i < 7; i++){
                            addDay( date.getDate(), date.getMonth(), date.getFullYear());
                            date.setDate( date.getDate() + 1 );
                        }
                    }


                    /**
                     * установка даты на первый валидный день
                     */

                    if ( RangesService.isWorking && !scrollFlag
                        && isDateDisabled({
                            day: DATE_SELECTED.getDate(),
                            month: DATE_SELECTED.getMonth(),
                            year: DATE_SELECTED.getFullYear()
                        })) {

                        var _dateSelected = {
                                day: DATE_SELECTED.getDate(),
                                month: DATE_SELECTED.getMonth(),
                                year: DATE_SELECTED.getFullYear()
                            },
                            activeRange = RangesService.getActiveRangeForDatepicker( $scope.bindedTo ),
                            _d = moment( [_dateSelected.year, _dateSelected.month, _dateSelected.day] ),
                            dStart = activeRange.from,
                            dEnd = activeRange.to,
                            result,
                            BOUNDS = RangesService.getBounds();

                        if ( dStart.isSame(BOUNDS.min) && dEnd.isSame(BOUNDS.max)
                            || dStart.isSame(BOUNDS.max) && dEnd.isSame(BOUNDS.max)
                            || dStart.isSame(BOUNDS.min) && dEnd.isSame(BOUNDS.min)){
                            return;
                        } else {
                            dStart.add('day',1);
                            dEnd.subtract('day',1)
                        }

                        if ( dStart.isAfter( dEnd ) ) {
                            //console.log('поиск дат в будущем', $attrs.mDate)
                            $scope.title = 'Нет доступных дат';

                            var ranges = RangesService.getSplittedRangesForDatepicker( $scope.bindedTo),
                                resultRanges = ranges,
                                result = _d;

                            // @TODO вынести это в метод сервиса
                            for (var i = 0, till = ranges.length; i < ranges.length; i++) {

                                var range1 = ranges[i];

                                for (var j = i + 1; j < till; j++) {
                                    var range2 = ranges[j];

                                    if ((range1.to.diff(range2.from, 'days') == -1 )) {
                                        resultRanges = _.without(resultRanges, range2, range1);
                                        resultRanges.push( { from: range1.from.clone(), to: range2.to.clone()})
                                    } else if ((range2.to.diff(range1.from, 'days') == -1 )) {
                                        resultRanges = _.without(resultRanges, range2, range1);
                                        resultRanges.push({ from: range2.from.clone(), to: range1.to.clone()})
                                    }
                                }
                            }

                            if ( resultRanges.length == 1 ){
                                if ( resultRanges[0].from.isSame(BOUNDS.min) && resultRanges[0].to.isSame(BOUNDS.max)){
                                    RENDER_DATE = new Date( year, month)
                                    console.log($attrs.mDate, ' нет доступных дат', resultRanges);
                                    return;
                                }
                            }

                            _.some(resultRanges, function (range) {
                                if (!range.to.isSame(BOUNDS.max) && (range.from.diff(_d, 'days') <= 0 && range.to.diff(_d, 'days') >= 0)) {
                                    result = range.to.clone().add('day', 1);
                                    return true;
                                }
                            });
                            // return;
                        } else if ( dStart.isSame( dEnd ) ) {
                            console.log( $attrs.mDate, 'доступен только один день')
                            result = dStart;
                        } else {
                            if ( _d.diff( dStart ) < 0 ) {
                                if ( Math.abs(_d.diff( dStart, 'days' )) < Math.abs(_d.diff( dEnd, 'days')) ) {
                                    result = dStart;
                                } else {
                                    result = dEnd;
                                }
                            } else if ( _d.diff( dStart) > 0 ){
                                if (_d.diff( dStart, 'days') < _d.diff( dEnd, 'days')) {
                                    result = dStart;
                                } else {
                                    result = dEnd;
                                }
                            } else {
                                result = _d;
                            }
                        }

                        DATE_SELECTED = result.toDate();
                        RENDER_DATE = new Date(DATE_SELECTED.getFullYear(), DATE_SELECTED.getMonth());
                        $scope.mDate = $filter('date')(DATE_SELECTED, 'd.M.yyyy');

                        console.log($attrs.mDate, "сдвигаем дату на", moment(DATE_SELECTED).format('DD.MM.YYYY'));
                    }
                };

                /**
                 * скролл на месяц вперёд
                 */
                $scope.nextMonth = function () {
                    var year = RENDER_DATE.getFullYear(),
                        month = RENDER_DATE.getMonth();

                    if (month == 11) {
                        year++;
                        month = 0;
                    } else {
                        month++;
                    }

                    RENDER_DATE = new Date(year, month);
                    $scope.renderDays( year, month, true );
                };

                /**
                 * скролл на месяц назад
                 */
                $scope.prevMonth = function () {
                    var month = RENDER_DATE.getMonth(),
                        year = RENDER_DATE.getFullYear();

                    if (month == 0) {
                        year--;
                        month = 11;
                    } else {
                        month--;
                    }

                    RENDER_DATE = new Date(year, month);
                    $scope.renderDays(year, month, true);

                };

                /**
                 * выбор даты и закрытие дропдауна
                 * @param item дата
                 */
                $scope.choose = function (item) {

                    var item = !!item ?
                        item : {
                            year: DATE_SELECTED.getFullYear(),
                            month: DATE_SELECTED.getMonth(),
                            day: DATE_SELECTED.getDate()
                        }

                    if ( !isDateDisabled( item ) ) {
                        var date = new Date( item.year, item.month, item.day );
                        DATE_SELECTED = date;

                        $scope.inputValue.day = item.day;
                        $scope.inputValue.month = item.month + 1;
                        $scope.inputValue.year = item.year;

                        $scope.renderDays( item.year, item.month );
                        RENDER_DATE = new Date( item.year, item.month );
                        $scope.mDate = $filter( 'date' )( date, 'd.M.yyyy' );

                        $scope.$emit('dropdown.close');

                    } else { // Показать подсказку
                        item.isShow = true;
                        setTimeout( function () {
                            item.isShow = false;
                            $scope.$apply();
                        }, 1000 );
                    }

                };

                /**
                 * проверка из RangesService в разрезе конкретного дэйтпикера
                 */
                var isDaySelectable = RangesService.isDateSelectable.bind( $scope.bindedTo );

                function isDateDisabled (date) {

                    var dateToCheck = new Date(date.year, date.month, date.day),
                        result = isDaySelectable(dateToCheck);

                    date.tooltip = result.message

                    return !result.selectable;
                }

                function isToday (item) {
                    return TODAY.getDate() == item.day && TODAY.getMonth() == item.month && TODAY.getFullYear() == item.year
                }


                function isCurrent (item) {

                    var _d = DATE_SELECTED;

                    if ( _d.getFullYear() == item.year && _d.getMonth() == item.month && _d.getDate() == item.day ) {
                        return !isDateDisabled( item );
                    }

                    return false
                };

                /**
                 * вотчер биндинга
                 */
                $scope.$watch( 'mDate', function (newVal, oldVal) {

                    var date = $filter('bolDate')(newVal);

                    if ( oldVal !== newVal ) {
                        DATE_SELECTED = date;
                        RENDER_DATE = new Date(date.getFullYear(), date.getMonth())
                        $scope.inputValue = { month: DATE_SELECTED.getMonth() + 1, day: DATE_SELECTED.getDate(), year: DATE_SELECTED.getFullYear()};

                        $scope.renderDays( date.getFullYear(), date.getMonth() );
                    } else { // init
                        $scope.inputValue = { month: date.getMonth() + 1, day: date.getDate(), year: date.getFullYear()}
                    }

                } );

                /**
                 * вотчер значений инпутов
                 */
                $scope.$watch( 'inputValue', function (newVal, oldVal, $scope) {
                    if ( oldVal !== newVal ) {
                        checkInputsValue( $scope, newVal );
                    }
                }, true );

                // если выбранный изначально день заблокирован, нужно выбрать ближайший валидный
                if ( isDateDisabled( {year: DATE_SELECTED.getFullYear(), month: DATE_SELECTED.getMonth(), day: DATE_SELECTED.getDate()} )){
                    $scope.renderDays( DATE_SELECTED.getFullYear(), DATE_SELECTED.getMonth())
                } else {
                    $scope.choose()
                }

            }
        };
    }

    awesomeDatepicker.$inject = ['$filter','$RangesService'];

})(angular, angular.module('awesome-datepicker'))