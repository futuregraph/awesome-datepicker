(function(ng, app){

    /**
     * @author Vitaly Gridnev
     */

    app.controller( 'dateCtrl', dateCtrl);

    function dateCtrl($scope, RangesService){

        var vm = this,
            MOMENT_DATEFORMAT = 'D.M.YYYY',
            TODAY = moment();

        vm.dateA = vm.dateB = vm.dateC = vm.dateD = TODAY.clone().format(MOMENT_DATEFORMAT);

        RangesService.flush();

        // для удобства
        var dateA = 'd.dateA',
            dateB = 'd.dateB',
            dateC = 'd.dateC',
            dateD = 'd.dateD',

        // зависимые периоды
        Bdependence1 = RangesService.createDependentRange( dateB, 'не раньше A' ),
        Bdependence2 = RangesService.createDependentRange( dateB, 'не позже A+10' ),

        Cdependence1 = RangesService.createDependentRange( dateC, 'не раньше B' ),
        Cdependence2 = RangesService.createDependentRange( dateC, 'не позже A+15' ),

        Ddependence1 = RangesService.createDependentRange( dateD, 'не раньше А-5' ),
        Ddependence2 = RangesService.createDependentRange( dateD, 'не позже C+5' ),

        // на первом блокируем с 12 по 14 число текущего месяца
        blockedA = RangesService.createDependentRange(  dateA, 'заблокировано, разрыв в периодах' ),

        // блокировки зависимых календарей, в которых даты должны быть в активном периоде dateA
        blockedB = RangesService.createDependentRange( dateB, 'заблочено из-за неактивного периода в А' ),
        blockedC = RangesService.createDependentRange( dateC, 'заблочено из-за неактивного периода в А' );

        blockedA.from = TODAY.clone().set('date',12).startOf('day');
        blockedA.to = TODAY.clone().set('date',14).startOf('day');

        $scope.$watch(
            function(){ return vm.dateA }
            , function (newVal, oldVal) {
                if ( oldVal !== newVal ) {
                    ADeps();
                }
            }
         );


        $scope.$watch(
            function(){ return vm.dateB },
            function (newVal, oldVal) {
                if ( oldVal !== newVal ) {
                    CDeps();
                }
            } )

        $scope.$watch(
            function(){ return vm.dateC },
            function (newVal, oldVal) {
                if ( oldVal !== newVal ) {
                    DDeps();
                }
            } )


        /**
         * зависимости даты А
         */
        function ADeps () {

            var _d = moment( vm.dateA, MOMENT_DATEFORMAT ),
                AActiveRange = RangesService.getActiveRangeForDatepicker( dateA, vm.dateA ),
                DATE1 = AActiveRange.from,
                DATE2 = AActiveRange.to;

            if ( _d.isBefore( DATE2 ) ) {
                blockedB.from = DATE2.clone();
                blockedC.from = DATE2.clone();

                blockedB.to = null;
                blockedC.to = null;
            } else {
                blockedB.from = null;
                blockedC.from = null;
                blockedB.to = DATE1.clone();
                blockedC.to = DATE1.clone();
            }

            BDeps();
            CDeps();
            DDeps();
        }


        /**
         * зависимости даты B
         */
        function BDeps () {

            var _d = moment( vm.dateA, MOMENT_DATEFORMAT );

            Bdependence1.to = _d.clone().subtract( 1, 'days');
            Bdependence2.from = _d.clone().add( 11, 'days' )

        }

        /**
         * зависимости даты C
         */
        function CDeps () {

            var _d1 = moment( vm.dateA, MOMENT_DATEFORMAT ),
                _d2 = moment( vm.dateB, MOMENT_DATEFORMAT );

            Cdependence1.to = _d2.clone()
            Cdependence2.from = _d1.clone().add( 16, 'days' )
        }

        /**
         * зависимости даты D
         */
        function DDeps () {

            var _d1 = moment( vm.dateA, MOMENT_DATEFORMAT ),
                _d2 = moment( vm.dateC, MOMENT_DATEFORMAT );

            Ddependence1.to = _d1.clone().subtract( 6, 'days' )
            Ddependence2.from = _d2.clone().add( 6, 'days' )

        }


        vm.isBlockAppear = !0; // переменная для текста кнопки заблокированного периода

        /**
         * убрать заблокированный период
         */
        vm.removeBlock = function () {
            blockedA.disable();
            ADeps();
            vm.isBlockAppear = !1;
        }

        /**
         * включить заблокированный период
         */
        vm.addBlock = function () {
            blockedA.enable();
            ADeps();
            vm.isBlockAppear = !0;
        }


        /**
         * блок-хелпер для подсветки условий
         */
        vm.datepickerHovered = 'a';
        ng.element( '.datepicker-wrap' )
            .on( 'mouseover', function (ev) {
                vm.datepickerHovered = $( this ).children( '.number' ).text().toLowerCase()
                $scope.$apply()
            } ).on( 'mouseout', function (ev) {
                vm.datepickerHovered = 'a'
                $scope.$apply()
            } )


        ADeps();
    }

    dateCtrl.$inject = ['$scope', '$RangesService']

})(angular, angular.module('demoApp'))