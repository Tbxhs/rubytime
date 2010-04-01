source "http://gemcutter.org"
source "http://gems.github.com"

dm_gems_version = "0.10.2"
gem "data_objects", dm_gems_version
gem "do_mysql", dm_gems_version

gem "dm-core", dm_gems_version
gem "dm-aggregates", dm_gems_version
gem "dm-timestamps", dm_gems_version
gem "dm-types" , dm_gems_version
gem "dm-validations", dm_gems_version
gem "dm-migrations", dm_gems_version
gem "dm-observer", dm_gems_version
gem "dm-serializer", dm_gems_version
# gem "dm-constraints", dm_gems_version
gem "dm-is-tree", dm_gems_version
gem "dm-is-list", dm_gems_version
gem "extlib", dm_gems_version

merb_gems_version = "1.1.0.pre"

gem "merb-core", merb_gems_version
gem "merb_datamapper", merb_gems_version
gem "merb-assets", merb_gems_version
gem "merb-helpers", merb_gems_version
gem "merb-mailer", merb_gems_version
gem "merb-slices", merb_gems_version
gem "merb-auth-core", merb_gems_version
gem "merb-auth-more", merb_gems_version
gem "merb-auth-slice-password", merb_gems_version

git "git://github.com/schwabsauce/merb_dm_xss_terminate.git" do
  gem "merb_dm_xss_terminate"
end

gem "mongrel", "1.1.5"
gem "ParseTree", "3.0.4"
gem "randexp", ">=0.1.3"
gem "chronic", ">=0.2.3"
gem "html5", ">=0.10.0"
gem "icalendar", "~>1.1.0"
gem 'rack_revision_info'

group :development do
  gem 'vlad', '2.0.0', :require => []
  gem 'vlad-git', '2.0.0', :require => []
  gem "metric_fu", "1.1.5"
end

group :development, :test do
  gem "rand"
  gem "dm-factory_girl", "1.2.3", :require => "factory_girl", :git => "git://github.com/sickill/factory_girl.git"
  gem "rspec", :require => "spec"
  gem "rcov"
  gem "rcov_stats"
  gem "webrat"
  gem "ci_reporter"
  gem "jslint_on_rails"
  gem 'ruby-debug'
  gem 'delorean'
end
