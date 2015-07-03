(function(ng, app ){

    app.filter('bolDate', function($filter) {
            return function(date, format) {
                if (angular.isString(date)) {
                    date = date.split('.');
                    var dateObj = new Date(date[2], date[1] - 1, date[0]);
                    if (!angular.isDate(dateObj)) return null;
                    return format ? $filter('date')(dateObj, format) : dateObj;
                }
                return date;
            }
        })

})(angular, angular.module('awesome-datepicker'))