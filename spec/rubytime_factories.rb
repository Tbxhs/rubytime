def ensure_rate_exists(args)
  params = { :project => args[:project], :role => args[:role] }
  existing = HourlyRate.first(params.merge(:takes_effect_at.lte => args[:takes_effect_at]))
  existing || Factory.create(:hourly_rate, params.merge(:takes_effect_at => Date.parse("2000-01-01")))
end


Factory.define(:employee, :class => Employee) do |u|
  u.sequence(:name) { |n| "RubyTime User ##{n}" }
  u.sequence(:login) { |n| "user_#{n}" }
  u.sequence(:email) { |n| "user_#{n}@rubytime.org" }
  u.password 'asdf1234'
  u.password_confirmation { |u| u.password }
  u.association :role
end

Factory.define(:admin, :parent => :employee) do |u|
  u.admin true
end

Factory.define(:client_user, :parent => :employee, :class => ClientUser) do |u|
  u.association :client
end

Factory.define(:client, :class => Client) do |u|
  u.sequence(:name) { |n| "Client ##{n}" }
  u.sequence(:description) { |n| "The decription of client ##{n}" }
  u.sequence(:email) { |n| "client_#{n}@company.com" }
end

Factory.define(:role, :class => Role) do |r|
  r.sequence(:name) { |n| "role_#{n}" }
end

Factory.define(:project, :class => Project) do |p|
  p.sequence(:name) { |n| "Project ##{n}" }
  p.association :client
end

Factory.define(:activity, :class => Activity) do |a|
  a.user { |rec| rec.association(:employee) }
  a.project { |rec| rec.association(:project) }
  a.date { Date.today }
  a.minutes { 30 }
  a.sequence(:comments) { |n| "Activity comment ##{n}" }
  a.after_build { |a| ensure_rate_exists(:project => a.project, :role => a.user.role, :takes_effect_at => a.date) }
end

Factory.define(:invoice, :class => Invoice) do |i|
  i.sequence(:name) { |n| "Invoice ##{n}" }
  i.client { |a| a.association(:client) }
  i.user { |a| a.association(:employee) }
end

Factory.define(:invoice_issued, :parent => :invoice) do |i|
  i.issued_at { Date.today }
end

Factory.define(:free_day, :class => FreeDay) do |fd|
  fd.user { |a| a.association(:employee) }
  fd.date { Date.today }
end

Factory.define(:hourly_rate, :class => HourlyRate) do |hr|
  hr.project { Project.pick_or_generate }
  hr.role { Role.pick_or_generate }
  hr.takes_effect_at { Date.today }
  hr.value { 1000 }
  hr.currency { Currency.pick_or_generate }
  hr.operation_author { Employee.first }
end

Factory.define(:hourly_rate_log, :class => HourlyRateLog) do |hrl|
  hrl.operation_type 'update'
  hrl.operation_author { Employee.pick_or_generate }
  hrl.hourly_rate { HourlyRate.pick_or_generate }
end

Factory.define(:currency, :class => Currency) do |c|
  c.sequence(:singular_name) { |n| "currency_#{n}" }
  c.sequence(:plural_name) { |n| "currency_#{n}s" }
  c.prefix "P"
end
